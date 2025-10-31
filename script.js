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

// Check if state query matches (handles both state codes like "TX" and state names like "Texas")
function matchesState(query, region, country) {
    if (!query || !region) return false;
    
    const queryUpper = query.toUpperCase();
    const regionUpper = region.toUpperCase();
    const countryUpper = country.toUpperCase();
    
    // Direct match
    if (regionUpper.includes(queryUpper) || countryUpper.includes(queryUpper)) {
        return true;
    }
    
    // US state code to name mapping
    if (countryUpper === 'UNITED STATES' || countryUpper === 'US') {
        const stateMap = {
            'AL': 'ALABAMA', 'AK': 'ALASKA', 'AZ': 'ARIZONA', 'AR': 'ARKANSAS',
            'CA': 'CALIFORNIA', 'CO': 'COLORADO', 'CT': 'CONNECTICUT', 'DE': 'DELAWARE',
            'FL': 'FLORIDA', 'GA': 'GEORGIA', 'HI': 'HAWAII', 'ID': 'IDAHO',
            'IL': 'ILLINOIS', 'IN': 'INDIANA', 'IA': 'IOWA', 'KS': 'KANSAS',
            'KY': 'KENTUCKY', 'LA': 'LOUISIANA', 'ME': 'MAINE', 'MD': 'MARYLAND',
            'MA': 'MASSACHUSETTS', 'MI': 'MICHIGAN', 'MN': 'MINNESOTA', 'MS': 'MISSISSIPPI',
            'MO': 'MISSOURI', 'MT': 'MONTANA', 'NE': 'NEBRASKA', 'NV': 'NEVADA',
            'NH': 'NEW HAMPSHIRE', 'NJ': 'NEW JERSEY', 'NM': 'NEW MEXICO', 'NY': 'NEW YORK',
            'NC': 'NORTH CAROLINA', 'ND': 'NORTH DAKOTA', 'OH': 'OHIO', 'OK': 'OKLAHOMA',
            'OR': 'OREGON', 'PA': 'PENNSYLVANIA', 'RI': 'RHODE ISLAND', 'SC': 'SOUTH CAROLINA',
            'SD': 'SOUTH DAKOTA', 'TN': 'TENNESSEE', 'TX': 'TEXAS', 'UT': 'UTAH',
            'VT': 'VERMONT', 'VA': 'VIRGINIA', 'WA': 'WASHINGTON', 'WV': 'WEST VIRGINIA',
            'WI': 'WISCONSIN', 'WY': 'WYOMING'
        };
        
        // Check if query is a state code and region matches state name
        if (stateMap[queryUpper] && regionUpper.includes(stateMap[queryUpper])) {
            return true;
        }
        
        // Check if query is a state name and region code matches
        for (const [code, name] of Object.entries(stateMap)) {
            if (name.includes(queryUpper) && regionUpper.includes(code)) {
                return true;
            }
        }
    }
    
    return false;
}

// Filter airports for autocomplete
function filterAirports(query) {
    if (!query || query.trim().length === 0 || airportData.length === 0) {
        return [];
    }
    
    const searchQuery = query.trim().toUpperCase();
    
    // Check if query looks like a city search (has a space or is longer than 2 chars and no code match)
    // Split query for city + state searches like "McAllen Texas"
    const queryParts = searchQuery.split(/\s+/);
    const cityQuery = queryParts[0]; // First part (city name)
    const stateQuery = queryParts.length > 1 ? queryParts.slice(1).join(' ') : null; // Rest (state/region)
    
    const codeMatches = []; // Priority 1-5: Code matches
    const nameMatches = []; // Priority 6: Name matches
    const cityMatches = []; // Priority 7: City matches (prioritize when query looks like city)
    
    // Search through airports
    for (const airport of airportData) {
        // Priority 1-5: Exact code prefix match (IATA first)
        const codeOrder = [
            { code: airport.iata_code, priority: 1 },
            { code: airport.icao_code, priority: 2 },
            { code: airport.ident, priority: 3 },
            { code: airport.local_code, priority: 4 },
            { code: airport.gps_code, priority: 5 }
        ].filter(item => item.code && item.code !== '');
        
        // Check if any code starts with the query
        const codeMatch = codeOrder.find(item => item.code.toUpperCase().startsWith(searchQuery));
        
        if (codeMatch) {
            codeMatches.push({
                ...airport,
                matchedCode: codeMatch.code,
                priority: codeMatch.priority
            });
            
            // If we have enough exact code matches, continue but don't skip city search
            if (codeMatches.length >= 10) {
                // Still search cities if query looks like a city name
                if (queryParts.length > 1 || searchQuery.length > 2) {
                    continue;
                } else {
                    break;
                }
            }
        }
        
        // Always search cities and names, but prioritize based on query type
        const city = airport.municipality ? airport.municipality.toUpperCase() : '';
        const airportName = airport.name ? airport.name.toUpperCase() : '';
        const isoRegion = airport.iso_region || '';
        const region = isoRegion.split('-')[1] || ''; // Get state code (US-TX -> TX)
        const country = getCountryName(airport.iso_country || '');
        
        // Check city match
        let cityMatch = false;
        if (city) {
            // If query has multiple parts, match city name and optionally state
            if (queryParts.length > 1) {
                if (city.includes(cityQuery) && (stateQuery === null || 
                    matchesState(stateQuery, region, country))) {
                    cityMatch = true;
                }
            } else {
                // Single word query - match if city starts with or contains it
                if (city.startsWith(searchQuery) || city.includes(searchQuery)) {
                    cityMatch = true;
                }
            }
        }
        
        if (cityMatch && cityMatches.length < 8) {
            cityMatches.push({
                ...airport,
                matchedCode: airport.iata_code || airport.ident || airport.local_code,
                priority: 7
            });
        }
        
        // Airport name match (if not too many city matches)
        if (airportName.includes(searchQuery) && nameMatches.length < 5 && cityMatches.length < 5) {
            nameMatches.push({
                ...airport,
                matchedCode: airport.iata_code || airport.ident || airport.local_code,
                priority: 6
            });
        }
    }
    
    // Sort code matches by priority and then alphabetically
    codeMatches.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        return (a.matchedCode || '').localeCompare(b.matchedCode || '');
    });
    
    // If query looks like a city search and we have city matches, prioritize them
    const isCitySearch = queryParts.length > 1 || (searchQuery.length > 2 && codeMatches.length === 0);
    
    // Combine matches - if it's a city search, show city matches first
    let allMatches;
    if (isCitySearch && cityMatches.length > 0) {
        allMatches = [...cityMatches, ...codeMatches, ...nameMatches];
    } else {
        allMatches = [...codeMatches, ...nameMatches, ...cityMatches];
    }
    
    // Return top 10
    return allMatches.slice(0, 10);
}

// Display autocomplete suggestions
function displaySuggestions(suggestions) {
    const autocomplete = document.getElementById('autocomplete');
    const searchInput = document.getElementById('searchInput');
    
    if (!autocomplete || !searchInput) return;
    
    const query = searchInput.value.trim();
    
    if (suggestions.length === 0 || !query) {
        autocomplete.classList.remove('show');
        return;
    }
    
    autocomplete.innerHTML = suggestions.map((airport, index) => {
        const code = airport.matchedCode || airport.iata_code || airport.ident || 'N/A';
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
            if (suggestions[index]) {
                selectSuggestion(suggestions[index]);
            }
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
    // Show loading message initially
    document.getElementById('results').innerHTML = `
        <div class="loading">Loading airport data...</div>
    `;
    
    await loadAirportData();
    
    // Clear loading message once data is loaded
    if (airportData.length > 0) {
        document.getElementById('results').innerHTML = '';
    }
    
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const autocomplete = document.getElementById('autocomplete');
    
    searchBtn.addEventListener('click', handleSearch);
    
    // Real-time autocomplete as user types
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(() => {
            const query = e.target.value.trim();
            
            if (query.length === 0) {
                autocomplete.classList.remove('show');
                document.getElementById('results').innerHTML = '';
                return;
            }
            
            if (airportData.length === 0) {
                console.log('Airport data not loaded yet');
                return;
            }
            
            currentSuggestions = filterAirports(query);
            console.log(`Found ${currentSuggestions.length} suggestions for "${query}"`);
            displaySuggestions(currentSuggestions);
        }, 100); // Reduced debounce time for more responsive feel
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
});
