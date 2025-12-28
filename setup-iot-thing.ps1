# Setup AWS IoT Thing for ESP32
# Creates Thing, generates certificates, attaches policy

$ErrorActionPreference = "Stop"
$Region = "ap-southeast-1"
$ThingName = "esp32-relay-01"
$PolicyName = "wsn-iot-policy"
$CertDir = ".\hardware\data"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "AWS IoT Thing Setup for ESP32" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Thing already exists
Write-Host "Checking if Thing exists..." -ForegroundColor Yellow
$existingThing = aws iot describe-thing --thing-name $ThingName --region $Region 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Thing '$ThingName' already exists" -ForegroundColor Green
    $createThing = $false
} else {
    Write-Host "Creating Thing '$ThingName'..." -ForegroundColor Yellow
    aws iot create-thing --thing-name $ThingName --region $Region | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Thing created successfully" -ForegroundColor Green
        $createThing = $true
    } else {
        Write-Host "✗ Failed to create Thing" -ForegroundColor Red
        exit 1
    }
}

# Check if certificates exist in hardware/data
Write-Host "`nChecking for existing certificates..." -ForegroundColor Yellow
$certExists = Test-Path "$CertDir\device.pem.crt"
$keyExists = Test-Path "$CertDir\private.pem.key"

if ($certExists -and $keyExists) {
    Write-Host "✓ Certificate files found in $CertDir" -ForegroundColor Green
    Write-Host "  - device.pem.crt" -ForegroundColor Gray
    Write-Host "  - private.pem.key" -ForegroundColor Gray
    
    # Get certificate content and extract fingerprint
    $certContent = Get-Content "$CertDir\device.pem.crt" -Raw
    
    # Try to find the certificate ID from AWS
    Write-Host "`nSearching for certificate in AWS IoT Core..." -ForegroundColor Yellow
    $certificates = aws iot list-certificates --region $Region | ConvertFrom-Json
    
    $foundCert = $null
    foreach ($cert in $certificates.certificates) {
        Write-Host "  Checking certificate: $($cert.certificateId)" -ForegroundColor Gray
        $certDetails = aws iot describe-certificate --certificate-id $cert.certificateId --region $Region 2>$null | ConvertFrom-Json
        
        if ($certDetails -and $certDetails.certificateDescription.certificatePem -eq $certContent.Trim()) {
            $foundCert = $cert
            Write-Host "✓ Found matching certificate: $($cert.certificateId)" -ForegroundColor Green
            break
        }
    }
    
    if ($foundCert) {
        $certificateArn = $foundCert.certificateArn
        $certificateId = $foundCert.certificateId
        
        # Check if certificate is active
        $certStatus = aws iot describe-certificate --certificate-id $certificateId --region $Region | ConvertFrom-Json
        if ($certStatus.certificateDescription.status -ne "ACTIVE") {
            Write-Host "Activating certificate..." -ForegroundColor Yellow
            aws iot update-certificate --certificate-id $certificateId --new-status ACTIVE --region $Region
            Write-Host "✓ Certificate activated" -ForegroundColor Green
        } else {
            Write-Host "✓ Certificate is already active" -ForegroundColor Green
        }
        
        # Attach certificate to Thing
        Write-Host "`nAttaching certificate to Thing..." -ForegroundColor Yellow
        aws iot attach-thing-principal --thing-name $ThingName --principal $certificateArn --region $Region 2>$null
        if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 254) {
            Write-Host "✓ Certificate attached to Thing" -ForegroundColor Green
        }
        
        # Attach policy to certificate
        Write-Host "Attaching policy '$PolicyName' to certificate..." -ForegroundColor Yellow
        aws iot attach-policy --policy-name $PolicyName --target $certificateArn --region $Region 2>$null
        if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 254) {
            Write-Host "✓ Policy attached to certificate" -ForegroundColor Green
        }
    } else {
        Write-Host "✗ Certificate not found in AWS IoT Core" -ForegroundColor Red
        Write-Host "  The certificate in hardware/data/ is not registered in AWS" -ForegroundColor Yellow
        Write-Host "  Please register it in AWS Console first or create a new one" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✗ Certificate files not found in $CertDir" -ForegroundColor Red
    Write-Host "  Please ensure device.pem.crt and private.pem.key exist" -ForegroundColor Yellow
    exit 1
}

# Get IoT endpoint
Write-Host "`nGetting IoT endpoint..." -ForegroundColor Yellow
$endpoint = aws iot describe-endpoint --endpoint-type iot:Data-ATS --region $Region | ConvertFrom-Json
Write-Host "✓ IoT Endpoint: $($endpoint.endpointAddress)" -ForegroundColor Green

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Thing Name: $ThingName" -ForegroundColor White
Write-Host "Policy: $PolicyName" -ForegroundColor White
Write-Host "Endpoint: $($endpoint.endpointAddress)" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. cd hardware" -ForegroundColor Gray
Write-Host "2. pio run --target uploadfs" -ForegroundColor Gray
Write-Host "3. pio run --target upload" -ForegroundColor Gray
Write-Host "4. pio device monitor" -ForegroundColor Gray
Write-Host ""
