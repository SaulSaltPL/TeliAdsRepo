const config = require('./passkeys.json');



// Función para obtener datos de la API
async function fetchAPIData() {
    try {
        const accessToken = config.accessToken;
        const adAccountId = config.adAccountId;
        const apiUrl = `https://graph.facebook.com/v17.0/act_${adAccountId}/insights`;
        
        const params = new URLSearchParams({
            fields: 'campaign_name,ad_name,spend,reach,impressions,video_thruplay_watched_actions,cost_per_action_type,date_start,date_stop',
            access_token: accessToken,
            level: 'ad',
            time_range: JSON.stringify({
                since: "2025-01-21",
                until: "2025-01-21"
            })
        });

        console.log('Fetching data from API...'); // Debug log
        const response = await fetch(`${apiUrl}?${params}`);
        
        if (!response.ok) {
            throw new Error(`Error al obtener los datos: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.data || !Array.isArray(data.data)) {
            throw new Error('Formato de datos inválido recibido de la API');
        }
        
        console.log(`Retrieved ${data.data.length} records from API`); // Debug log
        return data;
    } catch (error) {
        console.error('Error al realizar la llamada a la API:', error);
        throw error;
    }
}

// Función para procesar los datos y separarlos por día
async function processDailyData() {
    try {
        const jsonData = await fetchAPIData();
        
        if (jsonData.data.length === 0) {
            throw new Error('No hay datos disponibles para el período especificado');
        }

        const dailyData = {};

        // Procesar cada entrada
        jsonData.data.forEach((entry) => {
            const date = entry.date_start;
            if (!dailyData[date]) {
                dailyData[date] = [];
            }

            dailyData[date].push({
                campaign_name: entry.campaign_name ?? "No disponible",
                ad_name: entry.ad_name ?? "No disponible",
                reach: parseInt(entry.reach || 0, 10),
                impressions: parseInt(entry.impressions || 0, 10),
                video_thruplay_watched_actions: parseInt(entry.video_thruplay_watched_actions?.[0]?.value || 0, 10),
                spend: parseFloat(entry.spend || 0),
                cost_per_action_type: entry.cost_per_action_type?.filter(action => action.action_type === "video_view") || [],
                date_start: entry.date_start,
                date_stop: entry.date_stop
            });
        });

        console.log('Datos separados por día:', dailyData);
        return dailyData;
    } catch (error) {
        console.error('Error al procesar los datos:', error);
        throw error;
    }
}

// Ejecutar la función principal
processDailyData().catch(error => {
    console.error('Error en la ejecución:', error);
});