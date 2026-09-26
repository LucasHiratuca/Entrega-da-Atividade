Write-Host "Inicializando o Garage S3..."

# Aguarda o container estar pronto
do {
    Start-Sleep -Seconds 1
    $status = docker exec garage_s3 /garage status 2>&1
} while ($LASTEXITCODE -ne 0)

Write-Host "Obtendo ID do nó..."
$rawNodeId = docker exec garage_s3 /garage node id -q
$nodeId = $rawNodeId.Split('@')[0].Trim()

Write-Host "Configurando layout com nó $nodeId..."
docker exec garage_s3 /garage layout assign -z dc1 -c 1G $nodeId
docker exec garage_s3 /garage layout apply --version 1

Write-Host "Importando chaves de acesso S3..."
docker exec garage_s3 /garage key import --yes -n app-key GK9ae6ab4a2d12a3227b1a0d9a f46bb999a2d2615ad200369932ccff5454f113c74c4614e6027dc2380dcc5632

Write-Host "Criando bucket 'perfis'..."
docker exec garage_s3 /garage bucket create perfis
docker exec garage_s3 /garage bucket allow perfis --key GK9ae6ab4a2d12a3227b1a0d9a --read --write

Write-Host "Garage S3 inicializado e pronto para uso!"
