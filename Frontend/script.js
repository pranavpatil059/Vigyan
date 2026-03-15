const API_URL = "http://localhost:3000/api/transactions";
const REFRESH_INTERVAL = 5000;

const dom = {
  currentDateTime: document.getElementById("currentDateTime"),
  totalTransactions: document.getElementById("totalTransactions"),
  totalIssued: document.getElementById("totalIssued"),
  totalReturned: document.getElementById("totalReturned"),
  transactionsBody: document.getElementById("transactionsBody"),
  mostBorrowedBook: document.getElementById("mostBorrowedBook"),
  mostBorrowedCount: document.getElementById("mostBorrowedCount"),
  peakBorrowingHour: document.getElementById("peakBorrowingHour"),
  topBorrowedBooks: document.getElementById("topBorrowedBooks"),
  studentLookupForm: document.getElementById("studentLookupForm"),
  studentIdInput: document.getElementById("studentIdInput"),
  historySummary: document.getElementById("historySummary"),
  studentHistoryBody: document.getElementById("studentHistoryBody")
};

let borrowingChart;
let allTransactions = [];
let selectedStudentId = "";

function updateCurrentDateTime() {
  const now = new Date();
  dom.currentDateTime.textContent = now.toLocaleString([], {
    dateStyle: "full",
    timeStyle: "medium"
  });
}

function formatTimestamp(timestamp) {
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

function createActionBadge(action) {
  const normalizedAction = String(action || "").toLowerCase();
  const badgeClass = normalizedAction === "issue" ? "issue" : "return";
  const badgeLabel = normalizedAction || "unknown";

  return `<span class="badge ${badgeClass}">${badgeLabel}</span>`;
}

function createStatusBadge(status) {
  const normalizedStatus = String(status || "").toLowerCase();
  const allowedStatuses = ["returned", "pending", "overdue"];
  const badgeClass = allowedStatuses.includes(normalizedStatus) ? normalizedStatus : "pending";

  return `<span class="badge ${badgeClass}">${status}</span>`;
}

function getDueDate(issueDate) {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 30);
  return dueDate;
}

function calculateFine(dueDate, returnDate) {
  if (!(dueDate instanceof Date) || Number.isNaN(dueDate.getTime())) {
    return 0;
  }

  const comparisonDate = returnDate instanceof Date ? returnDate : new Date();

  if (Number.isNaN(comparisonDate.getTime()) || comparisonDate <= dueDate) {
    return 0;
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((comparisonDate - dueDate) / millisecondsPerDay);
}

function sortTransactionsByTimestamp(transactions) {
  return [...transactions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function buildStudentHistory(transactions, studentId) {
  const normalizedStudentId = String(studentId || "").trim().toLowerCase();

  if (!normalizedStudentId) {
    return [];
  }

  const studentTransactions = sortTransactionsByTimestamp(
    transactions.filter(
      (transaction) => String(transaction.student_id || "").trim().toLowerCase() === normalizedStudentId
    )
  );

  const openIssuesByBook = {};
  const history = [];

  studentTransactions.forEach((transaction) => {
    const action = String(transaction.action || "").toLowerCase();
    const bookId = transaction.book_id || "Unknown";
    const transactionDate = new Date(transaction.timestamp);

    if (Number.isNaN(transactionDate.getTime())) {
      return;
    }

    if (action === "issue") {
      const dueDate = getDueDate(transactionDate);
      const record = {
        studentId: transaction.student_id || studentId,
        bookId,
        issueDate: transactionDate,
        dueDate,
        returnDate: null,
        status: "Pending",
        fine: calculateFine(dueDate, null)
      };

      if (!openIssuesByBook[bookId]) {
        openIssuesByBook[bookId] = [];
      }

      openIssuesByBook[bookId].push(record);
      history.push(record);
      return;
    }

    if (action === "return" && openIssuesByBook[bookId]?.length) {
      const matchedIssue = openIssuesByBook[bookId].shift();
      matchedIssue.returnDate = transactionDate;
      matchedIssue.fine = calculateFine(matchedIssue.dueDate, transactionDate);
      matchedIssue.status = matchedIssue.fine > 0 ? "Overdue" : "Returned";
    }
  });

  history.forEach((record) => {
    if (!record.returnDate) {
      record.fine = calculateFine(record.dueDate, null);
      record.status = record.fine > 0 ? "Overdue" : "Pending";
    }
  });

  return history.sort((a, b) => b.issueDate - a.issueDate);
}

function updateStudentHistory(transactions, studentId) {
  const trimmedStudentId = String(studentId || "").trim();

  if (!trimmedStudentId) {
    dom.historySummary.textContent =
      "Enter a student ID to view borrowing history, due dates, fines, and return status.";
    dom.studentHistoryBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No student selected.</td>
      </tr>
    `;
    return;
  }

  const history = buildStudentHistory(transactions, trimmedStudentId);
  const totalFine = history.reduce((sum, record) => sum + record.fine, 0);
  const returnedCount = history.filter((record) => record.returnDate).length;

  dom.historySummary.textContent = history.length
    ? `${trimmedStudentId} has ${history.length} borrowing record(s), ${returnedCount} completed transaction(s), and total fines of Rs. ${totalFine}.`
    : `No borrowing records found for student ID ${trimmedStudentId}.`;

  if (!history.length) {
    dom.studentHistoryBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No matching student history found.</td>
      </tr>
    `;
    return;
  }

  dom.studentHistoryBody.innerHTML = history
    .map(
      (record) => `
        <tr>
          <td>${record.studentId}</td>
          <td>${record.bookId}</td>
          <td>${formatTimestamp(record.issueDate)}</td>
          <td>${formatTimestamp(record.dueDate)}</td>
          <td>${record.returnDate ? formatTimestamp(record.returnDate) : "Not returned yet"}</td>
          <td>${createStatusBadge(record.status)}</td>
          <td>Rs. ${record.fine}</td>
        </tr>
      `
    )
    .join("");
}

function renderTransactions(transactions) {
  if (!transactions.length) {
    dom.transactionsBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No transactions available.</td>
      </tr>
    `;
    return;
  }

  dom.transactionsBody.innerHTML = transactions
    .map(
      (transaction) => `
        <tr>
          <td>${transaction.student_id || "N/A"}</td>
          <td>${transaction.book_id || "N/A"}</td>
          <td>${createActionBadge(transaction.action)}</td>
          <td>${formatTimestamp(transaction.timestamp)}</td>
        </tr>
      `
    )
    .join("");
}

function updateStatistics(transactions) {
  const issuedTransactions = transactions.filter(
    (transaction) => String(transaction.action).toLowerCase() === "issue"
  );
  const returnedTransactions = transactions.filter(
    (transaction) => String(transaction.action).toLowerCase() === "return"
  );

  dom.totalTransactions.textContent = transactions.length;
  dom.totalIssued.textContent = issuedTransactions.length;
  dom.totalReturned.textContent = returnedTransactions.length;
}

function buildIssueAnalytics(transactions) {
  const issueTransactions = transactions.filter(
    (transaction) => String(transaction.action).toLowerCase() === "issue"
  );
  const bookFrequency = {};
  const hourlyCounts = Array.from({ length: 24 }, () => 0);

  issueTransactions.forEach((transaction) => {
    const bookId = transaction.book_id || "Unknown";
    bookFrequency[bookId] = (bookFrequency[bookId] || 0) + 1;

    const timestamp = new Date(transaction.timestamp);
    if (!Number.isNaN(timestamp.getTime())) {
      hourlyCounts[timestamp.getHours()] += 1;
    }
  });

  const rankedBooks = Object.entries(bookFrequency).sort((a, b) => b[1] - a[1]);
  const [topBookId = "N/A", topBookCount = 0] = rankedBooks[0] || [];
  const peakHourCount = Math.max(...hourlyCounts, 0);
  const peakHourIndex = hourlyCounts.indexOf(peakHourCount);

  return {
    issueTransactions,
    rankedBooks,
    topBookId,
    topBookCount,
    hourlyCounts,
    peakHourIndex,
    peakHourCount
  };
}

function updateDemandAnalysis(transactions) {
  const {
    rankedBooks,
    topBookId,
    topBookCount,
    hourlyCounts,
    peakHourIndex,
    peakHourCount
  } = buildIssueAnalytics(transactions);

  dom.mostBorrowedBook.textContent = topBookId;
  dom.mostBorrowedCount.textContent = `Borrow Count: ${topBookCount}`;

  if (peakHourCount > 0) {
    const nextHour = String((peakHourIndex + 1) % 24).padStart(2, "0");
    dom.peakBorrowingHour.textContent = `${String(peakHourIndex).padStart(2, "0")}:00 - ${nextHour}:00`;
  } else {
    dom.peakBorrowingHour.textContent = "N/A";
  }

  const topFive = rankedBooks.slice(0, 5);
  dom.topBorrowedBooks.innerHTML = topFive.length
    ? topFive
        .map(([bookId, count]) => `<li>${bookId} (${count} ${count === 1 ? "time" : "times"})</li>`)
        .join("")
    : "<li>No issued books yet</li>";

  updateChart(hourlyCounts);
}

function createChart() {
  const ctx = document.getElementById("borrowingChart");

  borrowingChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Array.from({ length: 24 }, (_, hour) => hour),
      datasets: [
        {
          label: "Books Issued",
          data: Array.from({ length: 24 }, () => 0),
          backgroundColor: "rgba(15, 108, 189, 0.72)",
          borderColor: "rgba(15, 108, 189, 1)",
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
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `Issued: ${context.parsed.y}`;
            }
          }
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
            text: "Number of Books Issued"
          }
        }
      }
    }
  });
}

function updateChart(hourlyCounts) {
  if (!borrowingChart) {
    createChart();
  }

  borrowingChart.data.datasets[0].data = hourlyCounts;
  borrowingChart.update();
}

function renderError(message) {
  dom.transactionsBody.innerHTML = `
    <tr>
      <td colspan="4" class="empty-state">${message}</td>
    </tr>
  `;
}

async function fetchTransactions() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const transactions = Array.isArray(data) ? data : [];
    allTransactions = transactions;

    renderTransactions(transactions);
    updateStatistics(transactions);
    updateDemandAnalysis(transactions);
    updateStudentHistory(allTransactions, selectedStudentId);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    renderError("Unable to load transactions from the backend API.");
    allTransactions = [];
    updateStatistics([]);
    updateDemandAnalysis([]);
    updateStudentHistory([], selectedStudentId);
  }
}

function bindStudentLookup() {
  dom.studentLookupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    selectedStudentId = dom.studentIdInput.value.trim();
    updateStudentHistory(allTransactions, selectedStudentId);
  });
}

function initDashboard() {
  updateCurrentDateTime();
  createChart();
  bindStudentLookup();
  fetchTransactions();

  setInterval(updateCurrentDateTime, 1000);
  setInterval(fetchTransactions, REFRESH_INTERVAL);
}

initDashboard();
