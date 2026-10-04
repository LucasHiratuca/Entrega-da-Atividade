$docxPath = "C:\Users\Usuario\catalogo-tom-hanks\docs\P1_Relatorio_LucasHiratuca.docx"
$pdfPath  = "C:\Users\Usuario\catalogo-tom-hanks\docs\P1_Relatorio_LucasHiratuca.pdf"

Write-Host "Iniciando conversao..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false

try {
    $doc = $word.Documents.Open($docxPath)
    # 17 = wdFormatPDF
    $doc.SaveAs([ref]$pdfPath, [ref]17)
    $doc.Close([ref]$false)
    Write-Host "PDF gerado com sucesso em: $pdfPath"
} catch {
    Write-Error "Erro na conversao: $_"
} finally {
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
