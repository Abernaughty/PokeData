# PowerShell script to test pagination in the GetCardsBySet Azure Function

# Get function key from local.settings.json or .env file if available, otherwise prompt for it
$functionKey = ""

# Try to read from local.settings.json
if (Test-Path "./local.settings.json") {
    try {
        $settings = Get-Content "./local.settings.json" | ConvertFrom-Json
        if ($settings.Values.FUNCTION_KEY) {
            $functionKey = $settings.Values.FUNCTION_KEY
            Write-Host "Using function key from local.settings.json" -ForegroundColor Green
        }
    } catch {
        Write-Host "Error reading local.settings.json: $_" -ForegroundColor Yellow
    }
}

# Try to read from .env if still not found
if (-not $functionKey -and (Test-Path "./.env")) {
    try {
        $envContent = Get-Content "./.env"
        foreach ($line in $envContent) {
            if ($line -match "FUNCTION_KEY=(.+)") {
                $functionKey = $matches[1].Trim()
                Write-Host "Using function key from .env file" -ForegroundColor Green
                break
            }
        }
    } catch {
        Write-Host "Error reading .env file: $_" -ForegroundColor Yellow
    }
}

# Prompt for key if still not found
if (-not $functionKey -or $functionKey -eq "YOUR_FUNCTION_KEY_HERE" -or $functionKey -eq "") {
    $functionKey = Read-Host "Enter your Azure Function key"
}

$functionBaseUrl = "https://pokedata-func.azurewebsites.net/api"
$setCode = "PRE" # Prismatic Evolutions has 180 cards

# Function to test with default page size
function Test-DefaultPageSize {
    Write-Host "`n=== Testing with DEFAULT pageSize ===" -ForegroundColor Cyan
    
    $url = "$functionBaseUrl/sets/$setCode/cards"
    Write-Host "Making request to: $url"
    
    try {
        $headers = @{
            "x-functions-key" = $functionKey
        }
        
        $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
        
        # Log pagination details
        Write-Host "`nResponse pagination details:" -ForegroundColor Green
        Write-Host "Total count: $($response.data.totalCount)"
        Write-Host "Page size: $($response.data.pageSize)"
        Write-Host "Page number: $($response.data.pageNumber)"
        Write-Host "Total pages: $($response.data.totalPages)"
        Write-Host "Items returned: $($response.data.items.Count)"
        
        return $response
    } catch {
        Write-Host "Error in default pageSize test:" -ForegroundColor Red
        Write-Host "Status code: $($_.Exception.Response.StatusCode.value__)"
        Write-Host "Response: $($_.Exception.Message)"
    }
}

# Function to test with explicit page size
function Test-ExplicitPageSize {
    Write-Host "`n=== Testing with EXPLICIT pageSize=500 ===" -ForegroundColor Cyan
    
    $url = "$functionBaseUrl/sets/$setCode/cards?pageSize=500"
    Write-Host "Making request to: $url"
    
    try {
        $headers = @{
            "x-functions-key" = $functionKey
        }
        
        $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
        
        # Log pagination details
        Write-Host "`nResponse pagination details:" -ForegroundColor Green
        Write-Host "Total count: $($response.data.totalCount)"
        Write-Host "Page size: $($response.data.pageSize)"
        Write-Host "Page number: $($response.data.pageNumber)"
        Write-Host "Total pages: $($response.data.totalPages)"
        Write-Host "Items returned: $($response.data.items.Count)"
        
        return $response
    } catch {
        Write-Host "Error in explicit pageSize test:" -ForegroundColor Red
        Write-Host "Status code: $($_.Exception.Response.StatusCode.value__)"
        Write-Host "Response: $($_.Exception.Message)"
    }
}

# Function to test with a page size of 100
function Test-PageSize100 {
    Write-Host "`n=== Testing with EXPLICIT pageSize=100 ===" -ForegroundColor Cyan
    
    $url = "$functionBaseUrl/sets/$setCode/cards?pageSize=100"
    Write-Host "Making request to: $url"
    
    try {
        $headers = @{
            "x-functions-key" = $functionKey
        }
        
        $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
        
        # Log pagination details
        Write-Host "`nResponse pagination details:" -ForegroundColor Green
        Write-Host "Total count: $($response.data.totalCount)"
        Write-Host "Page size: $($response.data.pageSize)"
        Write-Host "Page number: $($response.data.pageNumber)"
        Write-Host "Total pages: $($response.data.totalPages)"
        Write-Host "Items returned: $($response.data.items.Count)"
        
        return $response
    } catch {
        Write-Host "Error in pageSize=100 test:" -ForegroundColor Red
        Write-Host "Status code: $($_.Exception.Response.StatusCode.value__)"
        Write-Host "Response: $($_.Exception.Message)"
    }
}

# Run the tests
Write-Host "Testing pagination in GetCardsBySet Azure Function...`n" -ForegroundColor Yellow

# Check if function key is set
if ($functionKey -eq "YOUR_FUNCTION_KEY_HERE") {
    Write-Host "Please replace 'YOUR_FUNCTION_KEY_HERE' with your actual function key before running this script." -ForegroundColor Red
    exit
}

# Test with default page size
Test-DefaultPageSize

# Test with page size 100
Test-PageSize100

# Test with explicit page size 500
Test-ExplicitPageSize

Write-Host "`nTest completed. Check the Azure Portal logs for detailed information." -ForegroundColor Yellow
Write-Host "Application Insights query: traces | where customDimensions.Category contains 'GetCardsBySet'"
