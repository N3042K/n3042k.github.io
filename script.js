let airportData = [];

// Load CSV data
async function loadAirportData() {
    try {
        const response = await fetch('airport-codes.csv');
        const text = await response.text();
        const lines = text.split('\n');
        
        // Parse CSV (handle quoted fields)
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const row = parseCSVLine(lines[i]);
            if (row.length >= 13) {
                airportData.push({
                    ident: row[0],
                    type: row[1],
                    name: row[2],
                    elevation_ft: row[3],
                    continent: row[4],
                    iso_country: row[5],
                    iso_region: row[6],
                    municipality: row[7],
                    icao_code: row[8],
                    iata_code: row[9],
                    gps_code: row[10],
                    local_code: row[11],
                    coordinates: row[12]
                });
            }
        }
        
        console.log(`Loaded ${airportData.length} airports`);
    } catch (error) {
        console.error('Error loading airport data:', error);
        document.getElementById('results').innerHTML = `
            <div class="error-message">
                Failed to load airport data. Make sure airport-codes.csv is in the same directory.
                <br><br>
                Note: You may need to run a local server. Try: <code>python -m http.server</code> or <code>npx serve</code>
            </div>
        `;
    }
}

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    
    return result;
}

// Search for airport by code
function searchAirport(code) {
    if (!code || !code.trim()) {
        return null;
    }
    
    const searchCode = code.trim().toUpperCase();
    
    // Search by IATA code first, then ident, then local_code
    let result = airportData.find(airport => 
        airport.iata_code === searchCode ||
        airport.ident === searchCode ||
        airport.local_code === searchCode ||
        airport.gps_code === searchCode
    );
    
    return result;
}

// Display search results
function displayResult(airport) {
    const resultsContainer = document.getElementById('results');
    
    if (!airport) {
        resultsContainer.innerHTML = `
            <div class="error-message">
                Airport code not found. Please try another code.
            </div>
        `;
        return;
    }
    
    const code = airport.iata_code || airport.ident || airport.local_code;
    const municipality = airport.municipality || 'N/A';
    const country = airport.iso_country || 'N/A';
    const type = airport.type ? airport.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
    
    resultsContainer.innerHTML = `
        <div class="result-card">
            <div class="result-code">${code}</div>
            <div class="result-name">${airport.name}</div>
            <div class="result-details">
                <div class="result-detail-item">
                    <span class="result-detail-label">Location:</span>
                    <span>${municipality}, ${getCountryName(country)}</span>
                </div>
                <div class="result-detail-item">
                    <span class="result-detail-label">Type:</span>
                    <span>${type}</span>
                </div>
                ${airport.elevation_ft && airport.elevation_ft !== '' ? `
                <div class="result-detail-item">
                    <span class="result-detail-label">Elevation:</span>
                    <span>${parseInt(airport.elevation_ft).toLocaleString()} ft</span>
                </div>
                ` : ''}
                ${airport.coordinates && airport.coordinates !== '' ? `
                <div class="result-detail-item">
                    <span class="result-detail-label">Coordinates:</span>
                    <span>${airport.coordinates}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Get country name from ISO code (common ones)
function getCountryName(isoCode) {
    const countryMap = {
        'US': 'United States',
        'CA': 'Canada',
        'GB': 'United Kingdom',
        'FR': 'France',
        'DE': 'Germany',
        'IT': 'Italy',
        'ES': 'Spain',
        'AU': 'Australia',
        'JP': 'Japan',
        'CN': 'China',
        'BR': 'Brazil',
        'MX': 'Mexico',
        'IN': 'India',
        'RU': 'Russia',
        'KR': 'South Korea'
    };
    return countryMap[isoCode] || isoCode;
}

// Handle search
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const code = searchInput.value.trim();
    
    if (!code) {
        document.getElementById('results').innerHTML = `
            <div class="error-message">
                Please enter an airport code.
            </div>
        `;
        return;
    }
    
    const airport = searchAirport(code);
    displayResult(airport);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAirportData();
    
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    searchBtn.addEventListener('click', handleSearch);
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Show loading message initially
    document.getElementById('results').innerHTML = `
        <div class="loading">Loading airport data...</div>
    `;
});
