const ATTENDANCE_API_URL = "https://library-nfc-backend.vercel.app/api/attendance";
const ATTENDANCE_REFRESH_INTERVAL = 5000;

const attendanceDom = {
  attendanceDateTime: document.getElementById("attendanceDateTime"),
  totalScans: document.getElementById("totalScans"),
  uniqueStudents: document.getElementById("uniqueStudents"),
  todayScans: document.getElementById("todayScans"),
  peakAttendanceHour: document.getElementById("peakAttendanceHour"),
  mostActiveStudent: document.getElementById("mostActiveStudent"),
  mostActiveCount: document.getElementById("mostActiveCount"),
  latestScanStudent: document.getElementById("latestScanStudent"),
  latestScanTime: document.getElementById("latestScanTime"),
  attendanceBody: document.getElementById("attendanceBody")
};

let attendanceChart;

function updateAttendanceDateTime() {
  attendanceDom.attendanceDateTime.textContent = new Date().toLocaleString([], {
    dateStyle: "full",
    timeStyle: "medium"
  });
}

function formatAttendanceTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function normalizeAttendanceRecord(record) {
  return {
    studentId:
      record.student_id ||
      record.studentId ||
      record.id ||
      record.user_id ||
      record.card_owner ||
      "Unknown",
    studentName: record.name || record.student_name || record.studentName || "N/A",
    cardId: record.card_id || record.cardId || record.nfc_id || record.nfcId || record.uid || "N/A",
    timestamp: record.timestamp || record.time || record.scanned_at || record.created_at || "",
    status: record.status || "Present"
  };
}

function createAttendanceStatusBadge(status) {
  const normalizedStatus = String(status || "Present").toLowerCase();
  const badgeClass = normalizedStatus === "present" ? "issue" : "pending";
  return `<span class="badge ${badgeClass}">${status}</span>`;
}

function renderAttendanceTable(records) {
  if (!records.length) {
    attendanceDom.attendanceBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">No attendance records available.</td>
      </tr>
    `;
    return;
  }

  attendanceDom.attendanceBody.innerHTML = records
    .map(
      (record) => `
        <tr>
          <td>${record.studentId}</td>
          <td>${record.studentName}</td>
          <td>${record.cardId}</td>
          <td>${formatAttendanceTimestamp(record.timestamp)}</td>
          <td>${createAttendanceStatusBadge(record.status)}</td>
        </tr>
      `
    )
    .join("");
}

function createAttendanceChart() {
  const ctx = document.getElementById("attendanceChart");

  attendanceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Array.from({ length: 24 }, (_, hour) => hour),
      datasets: [
        {
          label: "Attendance Scans",
          data: Array.from({ length: 24 }, () => 0),
          backgroundColor: "rgba(15, 157, 88, 0.72)",
          borderColor: "rgba(15, 157, 88, 1)",
          borderWidth: 1,
          borderRadius: 8,
          maxBarThickness: 28
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Hour of Day"
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          },
          title: {
            display: true,
            text: "Number of Scans"
          }
        }
      }
    }
  });
}

function updateAttendanceChart(hourlyCounts) {
  if (!attendanceChart) {
    createAttendanceChart();
  }

  attendanceChart.data.datasets[0].data = hourlyCounts;
  attendanceChart.update();
}

function updateAttendanceAnalytics(records) {
  const uniqueStudents = new Set();
  const studentFrequency = {};
  const hourlyCounts = Array.from({ length: 24 }, () => 0);
  const today = new Date();
  let todayScans = 0;

  records.forEach((record) => {
    const timestamp = new Date(record.timestamp);
    uniqueStudents.add(record.studentId);
    studentFrequency[record.studentId] = (studentFrequency[record.studentId] || 0) + 1;

    if (!Number.isNaN(timestamp.getTime())) {
      hourlyCounts[timestamp.getHours()] += 1;

      if (
        timestamp.getFullYear() === today.getFullYear() &&
        timestamp.getMonth() === today.getMonth() &&
        timestamp.getDate() === today.getDate()
      ) {
        todayScans += 1;
      }
    }
  });

  const rankedStudents = Object.entries(studentFrequency).sort((a, b) => b[1] - a[1]);
  const [mostActiveStudent = "N/A", mostActiveCount = 0] = rankedStudents[0] || [];
  const peakHourCount = Math.max(...hourlyCounts, 0);
  const peakHourIndex = hourlyCounts.indexOf(peakHourCount);
  const latestRecord = [...records].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  attendanceDom.totalScans.textContent = records.length;
  attendanceDom.uniqueStudents.textContent = uniqueStudents.size;
  attendanceDom.todayScans.textContent = todayScans;
  attendanceDom.mostActiveStudent.textContent = mostActiveStudent;
  attendanceDom.mostActiveCount.textContent = `Scan Count: ${mostActiveCount}`;
  attendanceDom.peakAttendanceHour.textContent =
    peakHourCount > 0
      ? `${String(peakHourIndex).padStart(2, "0")}:00 - ${String((peakHourIndex + 1) % 24).padStart(2, "0")}:00`
      : "N/A";
  attendanceDom.latestScanStudent.textContent = latestRecord ? latestRecord.studentId : "N/A";
  attendanceDom.latestScanTime.textContent = latestRecord
    ? `${latestRecord.studentName} at ${formatAttendanceTimestamp(latestRecord.timestamp)}`
    : "No attendance records yet";

  updateAttendanceChart(hourlyCounts);
}

function renderAttendanceError(message) {
  attendanceDom.attendanceBody.innerHTML = `
    <tr>
      <td colspan="5" class="empty-state">${message}</td>
    </tr>
  `;
}

async function fetchAttendance() {
  try {
    const response = await fetch(ATTENDANCE_API_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const records = Array.isArray(data) ? data.map(normalizeAttendanceRecord) : [];

    renderAttendanceTable(records);
    updateAttendanceAnalytics(records);
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    renderAttendanceError("Unable to load attendance records from the backend API.");
    updateAttendanceAnalytics([]);
  }
}

function initAttendanceDashboard() {
  updateAttendanceDateTime();
  createAttendanceChart();
  fetchAttendance();

  setInterval(updateAttendanceDateTime, 1000);
  setInterval(fetchAttendance, ATTENDANCE_REFRESH_INTERVAL);
}

initAttendanceDashboard();
