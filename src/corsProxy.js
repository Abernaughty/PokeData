// Simple direct fetch - relies on your API Management service to handle CORS
export async function fetchWithProxy(url, options = {}) {
  // Just use the standard fetch with the provided options
  try {
    console.log(`Fetching from: ${url}`);
    console.log('Using headers:', options.headers);
    
    const response = await fetch(url, {
      ...options,
      mode: 'cors', // Use CORS mode to allow cross-origin requests
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to get error details');
      console.error(`HTTP Error: ${response.status} - ${response.statusText}\nURL: ${url}\nDetails: ${errorText}`);
      throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`Fetch error for URL [${url}]:`, error);
    throw error;
  }
}