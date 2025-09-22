import React, { useState, useEffect } from "react";
import "./App.css";
import Papa from "papaparse";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ReactPaginate from "react-paginate";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);


function App() {
  const [data, setData] = useState([]);
  const [insights, setInsights] = useState({
    totalEVs: 0,
    avgRange: 0,
    topMakes: [],
    years: {},
  });
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    Papa.parse("/Electric_Vehicle_Population_Data.csv", {
      download: true,
      header: true,
      chunkSize: 10000,
      complete: (results) => {
        const df = results.data.filter(
          (row) =>
            row["Electric Vehicle Type"] &&
            row["Model Year"] &&
            !isNaN(parseInt(row["Electric Range"]))
        );
        setData(df);

        const sampleSize = 5000;
        const sampleData = df.slice(0, sampleSize);
        const validRangeData = sampleData.filter(
          (row) => parseInt(row["Electric Range"]) > 0
        );
        const totalEVs = validRangeData.length;
        const avgRange =
          totalEVs > 0
            ? Math.round(
                validRangeData.reduce(
                  (acc, row) => acc + parseInt(row["Electric Range"]),
                  0
                ) / totalEVs
              )
            : 0;

        const makes = sampleData.reduce((acc, row) => {
          acc[row.Make] = (acc[row.Make] || 0) + 1;
          return acc;
        }, {});
        const topMakes = Object.entries(makes)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        const years = {};
        sampleData.forEach((row) => {
          const year = parseInt(row["Model Year"]);
          if (year >= 2012 && !isNaN(year)) {
            years[year] = (years[year] || 0) + 1;
          }
        });

        setInsights({ totalEVs, avgRange, topMakes, years });
      },
    });
  }, []);

  const offset = currentPage * itemsPerPage;
  const currentData = data.slice(offset, offset + itemsPerPage);

  const barData = {
    labels: insights.topMakes.map(([make]) => make),
    datasets: [
      {
        label: "Count",
        data: insights.topMakes.map(([, count]) => count),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
      },
    ],
  };

  const lineData = {
    labels: Object.keys(insights.years).sort((a, b) => a - b),
    datasets: [
      {
        label: "EVs",
        data: Object.values(insights.years),
        borderColor: "rgba(167, 139, 250, 1)",
        fill: false,
      },
    ],
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  return (
    <div className="dashboard">
      <h1>EV Analytics Dashboard</h1>
      <p>Total EVs: {data.length} (Full Data)</p>

      {/* Metrics */}
      <div className="metrics-container">
        <div className="metric-box">
          <h3>Average Range</h3>
          <p>{insights.avgRange} miles (Sampled)</p>
        </div>
        <div className="metric-box green">
          <h3>Top Company</h3>
          <p>{insights.topMakes[0]?.[0] || "N/A"}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-container">
        <div className="chart-box">
          <h3>Top 5 Companies</h3>
          <div className="chart">
            <Bar data={barData} />
          </div>
        </div>
        <div className="chart-box">
          <h3>EVs by Year</h3>
          <div className="chart">
            <Line data={lineData} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <h3>Data Table</h3>
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Model</th>
              <th>Year</th>
              <th>Range</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, i) => (
              <tr key={i}>
                <td>{row.Make}</td>
                <td>{row.Model}</td>
                <td>{row["Model Year"]}</td>
                <td>{row["Electric Range"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReactPaginate
        previousLabel={<button>Previous</button>}
        nextLabel={<button>Next</button>}
        breakLabel={"..."}
        pageCount={Math.ceil(data.length / itemsPerPage)}
        marginPagesDisplayed={2}
        pageRangeDisplayed={5}
        onPageChange={handlePageClick}
        containerClassName={"pagination"}
        activeClassName={"active"}
      />
    </div>
  );
}

export default App;
