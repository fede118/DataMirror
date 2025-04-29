// ========== IP & GEO ==========
let ipScore = 0;
fetch('https://ipapi.co/json/')
  .then(res => res.json())
  .then(data => {
    data.carrier = data.org
    document.getElementById('ip-info').textContent = JSON.stringify(data, null, 2);

    ipScore = data.city || data.region || data.country_name ? 2 : 0;

    // Add Google Maps view with a marker
    if (data.latitude && data.longitude) {
      const mapContainer = document.createElement('div');
      mapContainer.id = 'map';
      mapContainer.style.width = '100%';
      mapContainer.style.height = '300px';
      document.getElementById('map').appendChild(mapContainer);

      // Initialize the map
      const map = new google.maps.Map(mapContainer, {
        center: { lat: data.latitude, lng: data.longitude },
        zoom: 12,
      });

      // Add a marker
      new google.maps.Marker({
        position: { lat: data.latitude, lng: data.longitude },
        map: map,
        title: 'Your Location',
      });
    }
  }).catch(error => {
    console.log('Error fetching IP info:', error);
    document.getElementById('ip-info').textContent = "Unable to retrieve IP info.";
  });

// ========== DEVICE INFO ==========
const deviceInfo = {
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  vendor: navigator.vendor,
  hardwareConcurrency: navigator.hardwareConcurrency,
  deviceMemory: navigator.deviceMemory + ' GB',
  screen: {
    width: screen.width,
    height: screen.height,
    colorDepth: screen.colorDepth
  },
  window: {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight
  },
  battery: navigator.getBattery ? navigator.getBattery().then(battery => ({
      level: (battery.level * 100) + '%',
      charging: battery.charging
  })) : 'Unavailable',
};
document.getElementById('device-info').textContent = JSON.stringify(deviceInfo, null, 2);

// ========== OTHER INFO ==========
const otherInfo = {
  language: navigator.language,
  languages: navigator.languages,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  cookieEnabled: navigator.cookieEnabled,
  online: navigator.onLine,
  connection: navigator.connection ? {
    effectiveType: navigator.connection.effectiveType,
    downlink: navigator.connection.downlink + ' Mbps',
    rtt: navigator.connection.rtt + ' ms'
  } : 'Unavailable',
  referrer: document.referrer,
  currentUrl: window.location.href
};
document.getElementById('other-info').textContent = JSON.stringify(otherInfo, null, 2);

// ========== FINGERPRINT & RISK ==========
document.addEventListener('DOMContentLoaded', () => {
  FingerprintJS.load().then(fp => {
    fp.get().then(result => {
      const fpComponents = result.components;
      const hash = result.visitorId;

      const fingerprintBreakdown = [];

      const addScore = (label, condition) => {
      const score = condition ? 1 : 0;
      fingerprintBreakdown.push({ label, score });
      return score;
      };

      let uniquenessScore = 0;
      uniquenessScore += addScore('Platform', fpComponents.platform?.value);
      uniquenessScore += addScore('User Agent', fpComponents.userAgent?.value);
      uniquenessScore += addScore('Multiple Languages', fpComponents.language?.value?.length > 1);
      uniquenessScore += addScore('Uncommon Screen Resolution', fpComponents.screenResolution?.value?.join('x') !== '1920x1080');
      uniquenessScore += addScore('Timezone Info', fpComponents.timezone?.value);
      uniquenessScore += addScore('Low Device Memory (<4 GB)', fpComponents.memory?.value < 4);
      uniquenessScore += addScore('Few CPU Cores (≤2)', navigator.hardwareConcurrency <= 2);

      let riskLevel = '';
      let riskClass = '';

      if (uniquenessScore <= 3) {
        riskLevel = 'Low';
        riskClass = 'low';
      } else if (uniquenessScore <= 6) {
        riskLevel = 'Moderate';
        riskClass = 'moderate';
      } else {
        riskLevel = 'High';
        riskClass = 'high';
      }

      // Set fingerprint hash and total score
      document.getElementById('fp-info').textContent =
      `Fingerprint hash: ${result.visitorId}\nEstimated uniqueness score: ${uniquenessScore}`;

      // Set risk level label
      document.getElementById('risk-level').innerHTML =
      `Risk level: <span class="risk ${riskClass}">${riskLevel}</span>`;

    // Show breakdown
      const breakdownBody = document.getElementById('fp-breakdown-body');
      breakdownBody.innerHTML = fingerprintBreakdown.map(item => `
        <tr>
          <td>${item.label}</td>
          <td>${item.score}</td>
        </tr>
      `).join('');
    });
  });
});

