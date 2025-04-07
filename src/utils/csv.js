export function downloadCSV(data, filename = 'logs.csv') {
    const headers = ['Work', 'Stars', 'Timestamp'];
    const rows = data.map(log => [
      `"${log.work}"`,
      log.stars,
      new Date(log.timestamp.seconds * 1000).toLocaleString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  