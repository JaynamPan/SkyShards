//thanks for Plutoy's sky-shards.pages.dev 

const remoteUrl = "https://sky-shardfig.plutoy.top/minified.json";
export function getRemoteConfig(url = remoteUrl) {
    return fetch(url).then(response => {
        if (!response.ok) {
            return -111;
        }
        return response.json();
    }).then(data => {
        data = data.dailiesMap;
        const filteredDailiesMap = {};
        for (const dateKey in data) {
            if (Object.prototype.hasOwnProperty.call(data, dateKey)) {
                const dailyEntry = data[dateKey];
                const filteredDailyEntry = {};

                for (const key in dailyEntry) {
                    if (Object.prototype.hasOwnProperty.call(dailyEntry, key) && !key.includes('By')) {
                        filteredDailyEntry[key] = dailyEntry[key];
                    }
                }
                filteredDailiesMap[dateKey] = filteredDailyEntry;
            }
        }
        return filteredDailiesMap;
    }).catch(error => {
        console.log(error);
    });
}