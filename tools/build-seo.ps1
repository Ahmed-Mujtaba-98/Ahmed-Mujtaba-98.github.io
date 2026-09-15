<#
  build-seo.ps1 — pre-renders data/*.json into index.html so that search engines
  (and readers without JavaScript) see the publications and updates in the raw
  HTML source instead of a "Loading…" placeholder.

  Run it from the repository root after editing data/publications.json or
  data/updates.json:

      powershell -ExecutionPolicy Bypass -File tools\build-seo.ps1

  It rewrites only the regions between the SEO:* marker comments in index.html,
  plus <lastmod> in sitemap.xml. Everything else is left untouched.
#>

$ErrorActionPreference = 'Stop'

$root      = Split-Path $PSScriptRoot -Parent
$indexPath = Join-Path $root 'index.html'
$siteMap   = Join-Path $root 'sitemap.xml'
$pubsPath  = Join-Path $root 'data\publications.json'
$updPath   = Join-Path $root 'data\updates.json'
$siteUrl   = 'https://ahmed-mujtaba-98.github.io'

function Read-Utf8 { param($Path) [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8) }

function Write-Utf8 {
    param($Path, $Text)
    $enc = New-Object System.Text.UTF8Encoding($false)   # no BOM
    [System.IO.File]::WriteAllText($Path, $Text, $enc)
}

function Esc {
    param([string]$Text)
    if ($null -eq $Text) { return '' }
    $Text.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;').Replace('"', '&quot;')
}

# Strips the <strong> markup the JSON uses for author emphasis, for use in JSON-LD.
function Strip-Tags {
    param([string]$Text)
    if ($null -eq $Text) { return '' }
    ($Text -replace '<[^>]+>', '').Trim()
}

function Replace-Region {
    param([string]$Html, [string]$Marker, [string]$Body)
    $pattern = '(?s)(<!-- SEO:' + $Marker + ':START.*?-->).*?(<!-- SEO:' + $Marker + ':END -->)'
    if ($Html -notmatch $pattern) { throw "Marker SEO:$Marker not found in index.html" }
    [regex]::Replace($Html, $pattern, {
        param($m)
        $m.Groups[1].Value + "`r`n" + $Body + "`r`n          " + $m.Groups[2].Value
    })
}

# ── Inline icons, kept identical to the ones in script.js ────────────────
$iconPaper  = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
$iconCode   = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
$iconPoster = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="1"/><circle cx="9.5" cy="9.5" r="1.5"/><path d="M4 16l4.5-4.5a2 2 0 012.8 0L16 16M14 14l1.5-1.5a2 2 0 012.8 0L20 14"/></svg>'
$iconPpt    = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></svg>'
$iconExt    = '<svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'

$groups = @(
    @{ key = 'journal';    heading = 'Journal Articles'  },
    @{ key = 'conference'; heading = 'Conference Papers' },
    @{ key = 'workshop';   heading = 'Workshops'         }
)

$pubs    = Get-Content $pubsPath -Raw -Encoding UTF8 | ConvertFrom-Json
$updates = Get-Content $updPath  -Raw -Encoding UTF8 | ConvertFrom-Json

# ── 1. Publications: static HTML ─────────────────────────────────────────
$pubHtml    = New-Object System.Text.StringBuilder
$schemaPubs = @()

foreach ($group in $groups) {
    $items = @($pubs | Where-Object { $_.type -eq $group.key })
    if ($items.Count -eq 0) { continue }

    [void]$pubHtml.AppendLine('          <h3 class="pub-category-title">' + $group.heading + '</h3>')
    [void]$pubHtml.AppendLine('          <div class="pub-list">')

    foreach ($pub in $items) {
        [void]$pubHtml.AppendLine('            <article class="pub-card">')
        [void]$pubHtml.AppendLine('              <div class="pub-content">')
        # Author lists often already end in "." (e.g. "et al."), so avoid a double stop.
        $authorsText = $pub.authors -replace '\s*\.\s*$', ''
        [void]$pubHtml.AppendLine('                <p class="pub-citation">' + $authorsText + '. &ldquo;' + (Esc $pub.title) + '.&rdquo; <em>' + (Esc $pub.venue) + '</em>, ' + $pub.year + '.</p>')

        $actions = New-Object System.Text.StringBuilder
        if ($pub.paper) {
            [void]$actions.AppendLine('                  <a href="' + (Esc $pub.paper) + '" target="_blank" rel="noopener noreferrer" class="pub-btn pub-btn--paper">' + $iconPaper + ' Paper ' + $iconExt + '</a>')
        }
        if ($pub.code) {
            [void]$actions.AppendLine('                  <a href="' + (Esc $pub.code) + '" target="_blank" rel="noopener noreferrer" class="pub-btn pub-btn--code">' + $iconCode + ' Code ' + $iconExt + '</a>')
        }
        # Posters/slides are rendered as real links here so crawlers can reach the
        # PDFs; script.js swaps them for the citation-notice buttons once it runs.
        if ($pub.poster) {
            [void]$actions.AppendLine('                  <a href="' + (Esc $pub.poster) + '" target="_blank" rel="noopener noreferrer" class="pub-btn pub-btn--poster">' + $iconPoster + ' Poster ' + $iconExt + '</a>')
        }
        if ($pub.ppt) {
            [void]$actions.AppendLine('                  <a href="' + (Esc $pub.ppt) + '" target="_blank" rel="noopener noreferrer" class="pub-btn pub-btn--ppt">' + $iconPpt + ' PPT ' + $iconExt + '</a>')
        }
        if ($actions.Length -gt 0) {
            [void]$pubHtml.AppendLine('                <div class="pub-actions">')
            [void]$pubHtml.Append($actions.ToString())
            [void]$pubHtml.AppendLine('                </div>')
        }

        [void]$pubHtml.AppendLine('              </div>')
        [void]$pubHtml.AppendLine('            </article>')

        # ── matching ScholarlyArticle node ──
        $authorNames = (Strip-Tags $pub.authors)
        $node = [ordered]@{
            '@type'    = 'ScholarlyArticle'
            'headline' = (Strip-Tags $pub.title)
            'name'     = (Strip-Tags $pub.title)
            'author'   = @( @{ '@id' = "$siteUrl/#person" } )
            'creditText' = $authorNames
            'datePublished' = [string]$pub.year
            'isPartOf' = [ordered]@{
                '@type' = 'PublicationIssue'
                'name'  = (Strip-Tags $pub.venue)
            }
            'inLanguage' = 'en'
        }
        if ($pub.paper) { $node['url'] = $pub.paper; $node['sameAs'] = $pub.paper }
        if ($pub.code)  { $node['codeRepository'] = $pub.code }
        $schemaPubs += $node
    }

    [void]$pubHtml.AppendLine('          </div>')
}

# ── 2. Updates: static HTML ──────────────────────────────────────────────
$updHtml = New-Object System.Text.StringBuilder
foreach ($u in $updates) {
    [void]$updHtml.AppendLine('            <article class="update-card">')
    [void]$updHtml.AppendLine('              <div class="update-meta">')
    [void]$updHtml.AppendLine('                <time class="update-date" datetime="' + (Esc $u.datetime) + '">' + (Esc $u.dateDisplay) + '</time>')
    [void]$updHtml.AppendLine('              </div>')
    [void]$updHtml.AppendLine('              <div class="update-body"><p>' + (Esc $u.text) + '</p></div>')
    [void]$updHtml.AppendLine('            </article>')
}

# ── 3. Publication JSON-LD ───────────────────────────────────────────────
$schemaDoc = [ordered]@{
    '@context' = 'https://schema.org'
    '@graph'   = $schemaPubs
}
$schemaJson = $schemaDoc | ConvertTo-Json -Depth 12
$schemaBlock = '  <script type="application/ld+json">' + "`r`n" + $schemaJson + "`r`n" + '  </script>'

# ── 4. Splice everything into index.html ─────────────────────────────────
$html = Read-Utf8 $indexPath
$html = Replace-Region -Html $html -Marker 'PUBS'       -Body $pubHtml.ToString().TrimEnd()
$html = Replace-Region -Html $html -Marker 'UPDATES'    -Body $updHtml.ToString().TrimEnd()
$html = Replace-Region -Html $html -Marker 'PUBSCHEMA'  -Body $schemaBlock
Write-Utf8 $indexPath $html

# ── 5. Refresh sitemap lastmod ───────────────────────────────────────────
$today = Get-Date -Format 'yyyy-MM-dd'
$sm = Read-Utf8 $siteMap
$sm = [regex]::Replace($sm, '<lastmod>\d{4}-\d{2}-\d{2}</lastmod>', "<lastmod>$today</lastmod>")
Write-Utf8 $siteMap $sm

Write-Output ("Pre-rendered {0} publications and {1} updates into index.html" -f $pubs.Count, $updates.Count)
Write-Output ("Generated {0} ScholarlyArticle nodes" -f $schemaPubs.Count)
Write-Output ("sitemap.xml lastmod set to {0}" -f $today)
