let airportData = [];
let currentSuggestions = [];
let selectedIndex = -1;

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

// Filter airports for autocomplete
function filterAirports(query) {
    if (!query || query.trim().length === 0) {
        return [];
    }
    
    const searchQuery = query.trim().toUpperCase();
    const matches = [];
    
    for (const airport of airportData) {
        const codes = [
            airport.iata_code,
            airport.icao_code,
            airport.ident,
            airport.local_code,
            airport.gps_code
        ].filter(code => code && code !== '');
        
        const code = codes.find(c => c.toUpperCase().startsWith(searchQuery));
        
        if (code) {
            matches.push({
                ...airport,
                matchedCode: code
            });
        }
        
        // Limit to 10 suggestions for performance
        if (matches.length >= 10) {
            break;
        }
    }
    
    return matches;
}

// Display autocomplete suggestions
function displaySuggestions(suggestions) {
    const autocomplete = document.getElementById('autocomplete');
    
    if (suggestions.length === 0 || !document.getElementById('searchInput').value.trim()) {
        autocomplete.classList.remove('show');
        return;
    }
    
    autocomplete.innerHTML = suggestions.map((airport, index) => {
        const code = airport.matchedCode;
        const municipality = airport.municipality || '';
        const country = getCountryName(airport.iso_country || '');
        const location = municipality ? `${municipality}, ${country}` : country;
        
        return `
            <div class="autocomplete-item" data-index="${index}">
                <span class="autocomplete-code">${code}</span>
                <span class="autocomplete-name">${airport.name}</span>
                ${location ? `<span class="autocomplete-location">${location}</span>` : ''}
            </div>
        `;
    }).join('');
    
    autocomplete.classList.add('show');
    
    // Add click handlers
    autocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            selectSuggestion(suggestions[index]);
        });
    });
    
    selectedIndex = -1;
}

// Select a suggestion
function selectSuggestion(airport) {
    const searchInput = document.getElementById('searchInput');
    const code = airport.matchedCode || airport.iata_code || airport.ident;
    searchInput.value = code;
    
    const autocomplete = document.getElementById('autocomplete');
    autocomplete.classList.remove('show');
    
    displayResult(airport);
}

// Handle search
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const code = searchInput.value.trim();
    
    // Hide autocomplete
    document.getElementById('autocomplete').classList.remove('show');
    
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
document.addEventListener('DOMContentLoaded', async () => {
    await loadAirportData();
    
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const autocomplete = document.getElementById('autocomplete');
    
    searchBtn.addEventListener('click', handleSearch);
    
    // Real-time autocomplete as user types
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(() => {
            const query = e.target.value;
            if (query.trim().length > 0) {
                currentSuggestions = filterAirports(query);
                displaySuggestions(currentSuggestions);
            } else {
                autocomplete.classList.remove('show');
                document.getElementById('results').innerHTML = '';
            }
        }, 150);
    });
    
    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        const items = autocomplete.querySelectorAll('.autocomplete-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateHighlight(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateHighlight(items);
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0 && currentSuggestions[selectedIndex]) {
                e.preventDefault();
                selectSuggestion(currentSuggestions[selectedIndex]);
            } else {
                handleSearch();
            }
        } else if (e.key === 'Escape') {
            autocomplete.classList.remove('show');
            selectedIndex = -1;
        }
    });
    
    function updateHighlight(items) {
        items.forEach((item, index) => {
            item.classList.toggle('highlighted', index === selectedIndex);
        });
        if (selectedIndex >= 0 && items[selectedIndex]) {
            items[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }
    
    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        const inputWrapper = searchInput.closest('.input-wrapper');
        if (inputWrapper && !inputWrapper.contains(e.target)) {
            autocomplete.classList.remove('show');
        }
    });
    
    // Show loading message initially
    document.getElementById('results').innerHTML = `
        <div class="loading">Loading airport data...</div>
    `;
});
