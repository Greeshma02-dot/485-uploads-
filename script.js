let allData = [];

let filteredData = [];


let monthlyChart = null;

let acoChart = null;

let nurseChart = null;

let practiceChart = null;

let nurseOnlyChart = null;

let nursePracticeChart = null;

let nurseTrendChart = null;

let practice485AcoChart = null;

let practice485Data = { practices: [], metrics: {}, lastUpdated: "" };

let practice485EmrOnly = false;


const MAX_TABLE_ROWS = 500;



document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);



function initializeDashboard() {

    registerEvents();

    loadDashboardData();

}



function registerEvents() {

    document
        .getElementById("acoFilter")
        .addEventListener(
            "change",
            applyFilters
        );


    document
        .getElementById("startDate")
        .addEventListener(
            "change",
            applyFilters
        );


    document
        .getElementById("endDate")
        .addEventListener(
            "change",
            applyFilters
        );


    document
        .getElementById("nurseFilter")
        .addEventListener(
            "change",
            applyFilters
        );


    document
        .getElementById("practiceFilter")
        .addEventListener(
            "change",
            applyFilters
        );


    document
        .getElementById("overviewSearch")
        .addEventListener(
            "input",
            applyFilters
        );


    document
        .getElementById("nurseSearch")
        .addEventListener(
            "input",
            updateNursesPage
        );


    document
        .getElementById("clearFiltersBtn")
        .addEventListener(
            "click",
            clearFilters
        );


    const practice485AcoFilter = document.getElementById("practice485AcoFilter");
    const practice485StatusFilter = document.getElementById("practice485StatusFilter");
    const practice485ConsultantFilter = document.getElementById("practice485ConsultantFilter");
    const practice485Search = document.getElementById("practice485Search");
    const practice485ClearFilters = document.getElementById("practice485ClearFilters");

    if (practice485AcoFilter) practice485AcoFilter.addEventListener("change", applyPractice485Filters);
    if (practice485StatusFilter) practice485StatusFilter.addEventListener("change", function () {
        practice485EmrOnly = false;
        setPractice485ActiveCard(null);
        applyPractice485Filters();
    });
    if (practice485ConsultantFilter) practice485ConsultantFilter.addEventListener("change", applyPractice485Filters);
    if (practice485Search) practice485Search.addEventListener("input", applyPractice485Filters);
    if (practice485ClearFilters) practice485ClearFilters.addEventListener("click", clearPractice485Filters);

    document.querySelectorAll("[data-485-card-filter]").forEach(button => {
        button.addEventListener("click", function () {
            applyPractice485CardFilter(button.dataset["485CardFilter"]);
        });
    });


    document
        .querySelectorAll(".pageButton")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    switchPage(
                        button.dataset.page
                    );

                }
            );

        });

}



function loadDashboardData() {

    hideError();


    const dashboardData =
        window.DASHBOARD_DATA;


    if (
        !dashboardData ||
        !Array.isArray(dashboardData.data)
    ) {

        document
            .getElementById("lastUpdated")
            .textContent =
            "Data unavailable";


        showError(
            "Dashboard data could not be loaded. Confirm data.js is in the same folder as index.html."
        );


        return;

    }


    try {

        allData =
            dashboardData.data.map(
                normalizeRow
            );


        document
            .getElementById("lastUpdated")
            .textContent =
            (dashboardData.uploadLastUpdated || dashboardData.lastUpdated)
                ? `Updated: ${dashboardData.uploadLastUpdated || dashboardData.lastUpdated}`
                : "Update time unavailable";


        practice485Data = dashboardData.practice485 || { practices: [], metrics: {}, lastUpdated: "" };


        populateFilters();

        initializePractice485Page();

        applyFilters();

    }
    catch (error) {

        console.error(
            "Dashboard rendering error:",
            error
        );


        showError(
            `Dashboard rendering error: ${error.message}`
        );

    }

}



function normalizeRow(row) {

    const rawNurseValue =
        row.isOurNurse;


    const nurseText =
        String(
            rawNurseValue ?? ""
        )
            .trim()
            .toLowerCase();


    const isNurse =

        Number(rawNurseValue) === 1 ||

        nurseText === "1" ||

        nurseText === "yes" ||

        nurseText === "true" ||

        nurseText === "nurse";


    return {

        date:
            normalizeDate(
                row.date
            ),

        month:
            String(
                row.month || ""
            ).trim(),

        uploadedBy:
            String(
                row.uploadedBy || ""
            ).trim(),

        reviewerRole:
            String(
                row.reviewerRole || ""
            ).trim(),

        reviewerType:
            String(
                row.reviewerType || ""
            ).trim(),

        status:
            String(
                row.status || ""
            ).trim(),

        reviewSource:
            String(
                row.reviewSource || ""
            ).trim(),

        aco:
            String(
                row.aco || ""
            ).trim(),

        tin:
            String(
                row.tin || ""
            ).trim(),

        practice:
            String(
                row.practice || ""
            ).trim(),

        isOurNurse:
            isNurse ? 1 : 0,

        type:
            isNurse
                ? "Nurse"
                : "BOT"

    };

}



function normalizeDate(value) {

    if (!value) {

        return "";

    }


    const text =
        String(value).trim();


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(text)
    ) {

        return text;

    }


    const parsed =
        new Date(text);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return text;

    }


    const year =
        parsed.getFullYear();


    const month =
        String(
            parsed.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            parsed.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}



function populateFilters() {

    fillSelect(

        "acoFilter",

        allData.map(
            row => row.aco
        ),

        "All ACOs"

    );


    fillSelect(

        "nurseFilter",

        allData
            .filter(
                row =>
                    row.isOurNurse === 1
            )
            .map(
                row => row.uploadedBy
            ),

        "All Nurses / Uploaders"

    );


    fillSelect(

        "practiceFilter",

        allData.map(
            row => row.practice
        ),

        "All Practices"

    );

}



function fillSelect(
    id,
    values,
    defaultText
) {

    const select =
        document.getElementById(id);


    const uniqueValues =

        [
            ...new Set(

                values

                    .map(
                        value =>
                            String(
                                value || ""
                            ).trim()
                    )

                    .filter(Boolean)

            )
        ]

            .sort(
                (a, b) =>
                    a.localeCompare(b)
            );


    select.innerHTML = "";


    const defaultOption =
        document.createElement("option");


    defaultOption.value =
        "All";


    defaultOption.textContent =
        defaultText;


    select.appendChild(
        defaultOption
    );


    uniqueValues.forEach(
        value => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                value;


            option.textContent =
                value;


            select.appendChild(
                option
            );

        }
    );

}



function applyFilters() {

    const selectedAco =
        document
            .getElementById("acoFilter")
            .value;


    const selectedNurse =
        document
            .getElementById("nurseFilter")
            .value;


    const selectedPractice =
        document
            .getElementById("practiceFilter")
            .value;


    const startDate =
        document
            .getElementById("startDate")
            .value;


    const endDate =
        document
            .getElementById("endDate")
            .value;


    const searchText =
        document
            .getElementById("overviewSearch")
            .value
            .trim()
            .toLowerCase();


    filteredData =
        allData.filter(
            row => {

                const matchesAco =

                    selectedAco === "All" ||

                    row.aco === selectedAco;


                const matchesNurse =

                    selectedNurse === "All" ||

                    row.uploadedBy === selectedNurse;


                const matchesPractice =

                    selectedPractice === "All" ||

                    row.practice === selectedPractice;


                const matchesStart =

                    !startDate ||

                    (
                        row.date &&
                        row.date >= startDate
                    );


                const matchesEnd =

                    !endDate ||

                    (
                        row.date &&
                        row.date <= endDate
                    );


                const rowText =

                    [

                        row.date,

                        row.aco,

                        row.practice,

                        row.uploadedBy,

                        row.type,

                        row.status,

                        row.reviewSource,

                        row.tin

                    ]

                        .join(" ")

                        .toLowerCase();


                const matchesSearch =

                    !searchText ||

                    rowText.includes(
                        searchText
                    );


                return (

                    matchesAco &&

                    matchesNurse &&

                    matchesPractice &&

                    matchesStart &&

                    matchesEnd &&

                    matchesSearch

                );

            }
        );


    updateOverviewPage();

    updateNursesPage();

}



function updateOverviewPage() {

    const total =
        filteredData.length;


    const nurseTotal =

        filteredData.filter(
            row =>
                row.isOurNurse === 1
        ).length;


    const botTotal =

        filteredData.filter(
            row =>
                row.isOurNurse === 0
        ).length;


    const nursePercentage =

        total > 0

            ? (
                nurseTotal /
                total
            ) * 100

            : 0;


    const botPercentage =

        total > 0

            ? (
                botTotal /
                total
            ) * 100

            : 0;


    document
        .getElementById("totalUploads")
        .textContent =
        total.toLocaleString();


    document
        .getElementById("nurseUploads")
        .textContent =
        nurseTotal.toLocaleString();


    document
        .getElementById("botUploads")
        .textContent =
        botTotal.toLocaleString();


    document
        .getElementById("nursePercent")
        .textContent =
        `${nursePercentage.toFixed(1)}%`;


    document
        .getElementById("botPercent")
        .textContent =
        `${botPercentage.toFixed(1)}%`;


    updateOverviewTable();

    updateOverviewCharts();

}



function updateOverviewTable() {

    const tbody =
        document
            .getElementById(
                "overviewTableBody"
            );


    tbody.innerHTML = "";


    const totalRows =
        filteredData.length;


    document
        .getElementById("overviewCount")
        .textContent =

        totalRows > MAX_TABLE_ROWS

            ? `Showing first ${MAX_TABLE_ROWS.toLocaleString()} of ${totalRows.toLocaleString()} records`

            : `Showing ${totalRows.toLocaleString()} records`;


    if (
        totalRows === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="emptyMessage"
                >

                    No records match the selected filters.

                </td>

            </tr>

        `;


        return;

    }


    const rows =

        [...filteredData]

            .sort(
                (a, b) =>
                    String(b.date)
                        .localeCompare(
                            String(a.date)
                        )
            )

            .slice(
                0,
                MAX_TABLE_ROWS
            );


    rows.forEach(
        row => {

            const tr =
                document.createElement(
                    "tr"
                );


            const badgeClass =

                row.isOurNurse === 1

                    ? "nurseBadge"

                    : "botBadge";


            tr.innerHTML = `

                <td>
                    ${escapeHtml(
                        displayDate(
                            row.date
                        )
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        row.aco
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        row.practice
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        row.uploadedBy
                    )}
                </td>

                <td>

                    <span
                        class="typeBadge ${badgeClass}"
                    >

                        ${escapeHtml(
                            row.type
                        )}

                    </span>

                </td>

                <td>
                    ${escapeHtml(
                        row.status
                    )}
                </td>

            `;


            tbody.appendChild(
                tr
            );

        }
    );

}



function updateNursesPage() {

    const nurseRows =

        filteredData.filter(
            row =>
                row.isOurNurse === 1
        );


    const uniqueNurses =

        new Set(

            nurseRows

                .map(
                    row =>
                        row.uploadedBy
                )

                .filter(Boolean)

        );


    const uniquePractices =

        new Set(

            nurseRows

                .map(
                    row =>
                        row.practice
                )

                .filter(Boolean)

        );


    const uniqueAcos =

        new Set(

            nurseRows

                .map(
                    row =>
                        row.aco
                )

                .filter(Boolean)

        );


    document
        .getElementById("nursePageTotal")
        .textContent =
        nurseRows.length.toLocaleString();


    document
        .getElementById("activeNurses")
        .textContent =
        uniqueNurses.size.toLocaleString();


    document
        .getElementById("nursePractices")
        .textContent =
        uniquePractices.size.toLocaleString();


    document
        .getElementById("nurseAcos")
        .textContent =
        uniqueAcos.size.toLocaleString();


    updateNurseTable(
        nurseRows
    );


    updateNurseCharts(
        nurseRows
    );

}



function updateNurseTable(
    nurseRows
) {

    const tbody =
        document
            .getElementById(
                "nurseTableBody"
            );


    const searchText =
        document
            .getElementById("nurseSearch")
            .value
            .trim()
            .toLowerCase();


    const searchedRows =

        nurseRows.filter(
            row => {

                const rowText =

                    [

                        row.date,

                        row.aco,

                        row.practice,

                        row.uploadedBy,

                        row.status,

                        row.reviewSource,

                        row.tin

                    ]

                        .join(" ")

                        .toLowerCase();


                return (

                    !searchText ||

                    rowText.includes(
                        searchText
                    )

                );

            }
        );


    document
        .getElementById("nurseCount")
        .textContent =

        searchedRows.length >
        MAX_TABLE_ROWS

            ? `Showing first ${MAX_TABLE_ROWS.toLocaleString()} of ${searchedRows.length.toLocaleString()} records`

            : `Showing ${searchedRows.length.toLocaleString()} records`;


    tbody.innerHTML = "";


    if (
        searchedRows.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="emptyMessage"
                >

                    No nurse records match the selected filters.

                </td>

            </tr>

        `;


        return;

    }


    [...searchedRows]

        .sort(
            (a, b) =>
                String(b.date)
                    .localeCompare(
                        String(a.date)
                    )
        )

        .slice(
            0,
            MAX_TABLE_ROWS
        )

        .forEach(
            row => {

                const tr =
                    document.createElement(
                        "tr"
                    );


                tr.innerHTML = `

                    <td>
                        ${escapeHtml(
                            displayDate(
                                row.date
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            row.aco
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            row.practice
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            row.uploadedBy
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            row.status
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            row.reviewSource
                        )}
                    </td>

                `;


                tbody.appendChild(
                    tr
                );

            }
        );

}



function updateOverviewCharts() {

    if (
        typeof Chart === "undefined"
    ) {

        console.warn(
            "Chart.js is unavailable."
        );


        return;

    }


    const monthlyGroups = {};


    filteredData.forEach(
        row => {

            const month =
                getMonthKey(row);


            if (!month) {

                return;

            }


            if (
                !monthlyGroups[month]
            ) {

                monthlyGroups[month] = {

                    nurse: 0,

                    bot: 0

                };

            }


            if (
                row.isOurNurse === 1
            ) {

                monthlyGroups[month]
                    .nurse += 1;

            }
            else {

                monthlyGroups[month]
                    .bot += 1;

            }

        }
    );


    const months =

        Object
            .keys(monthlyGroups)
            .sort();


    monthlyChart =

        replaceChart(

            monthlyChart,

            "monthlyChart",

            {

                type: "bar",

                data: {

                    labels:

                        months.map(
                            formatMonthLabel
                        ),

                    datasets: [

                        {

                            label:
                                "Nurse",

                            data:

                                months.map(
                                    month =>
                                        monthlyGroups[
                                            month
                                        ].nurse
                                ),

                            backgroundColor:
                                "#12d5bb"

                        },

                        {

                            label:
                                "BOT",

                            data:

                                months.map(
                                    month =>
                                        monthlyGroups[
                                            month
                                        ].bot
                                ),

                            backgroundColor:
                                "#7c91b2"

                        }

                    ]

                },

                options:
                    getChartOptions()

            }

        );


    const acoData =

        countBy(
            filteredData,
            "aco"
        )

            .slice(
                0,
                12
            );


    acoChart =

        replaceChart(

            acoChart,

            "acoChart",

            createHorizontalChart(

                acoData,

                "Uploads",

                "#12d5bb"

            )

        );


    const nurseRows =

        filteredData.filter(
            row =>
                row.isOurNurse === 1
        );


    const nurseData =

        countBy(
            nurseRows,
            "uploadedBy"
        )

            .slice(
                0,
                15
            );


    nurseChart =

        replaceChart(

            nurseChart,

            "nurseChart",

            createHorizontalChart(

                nurseData,

                "Nurse Uploads",

                "#4fa5ff"

            )

        );


    const practiceData =

        countBy(
            filteredData,
            "practice"
        )

            .slice(
                0,
                15
            );


    practiceChart =

        replaceChart(

            practiceChart,

            "practiceChart",

            createHorizontalChart(

                practiceData,

                "Uploads",

                "#a982ff"

            )

        );

}



function updateNurseCharts(
    nurseRows
) {

    if (
        typeof Chart === "undefined"
    ) {

        return;

    }


    const nurseData =

        countBy(
            nurseRows,
            "uploadedBy"
        )

            .slice(
                0,
                15
            );


    nurseOnlyChart =

        replaceChart(

            nurseOnlyChart,

            "nurseOnlyChart",

            createHorizontalChart(

                nurseData,

                "Nurse Uploads",

                "#12d5bb"

            )

        );


    const practiceData =

        countBy(
            nurseRows,
            "practice"
        )

            .slice(
                0,
                15
            );


    nursePracticeChart =

        replaceChart(

            nursePracticeChart,

            "nursePracticeChart",

            createHorizontalChart(

                practiceData,

                "Nurse Uploads",

                "#a982ff"

            )

        );


    const monthlyCounts = {};


    nurseRows.forEach(
        row => {

            const month =
                getMonthKey(row);


            if (!month) {

                return;

            }


            monthlyCounts[month] =

                (
                    monthlyCounts[month] ||
                    0
                ) + 1;

        }
    );


    const months =

        Object
            .keys(monthlyCounts)
            .sort();


    nurseTrendChart =

        replaceChart(

            nurseTrendChart,

            "nurseTrendChart",

            {

                type: "line",

                data: {

                    labels:

                        months.map(
                            formatMonthLabel
                        ),

                    datasets: [

                        {

                            label:
                                "Nurse Uploads",

                            data:

                                months.map(
                                    month =>
                                        monthlyCounts[
                                            month
                                        ]
                                ),

                            borderColor:
                                "#12d5bb",

                            backgroundColor:
                                "rgba(18, 213, 187, 0.15)",

                            fill: true,

                            tension: 0.25

                        }

                    ]

                },

                options:
                    getChartOptions()

            }

        );

}



function countBy(
    rows,
    field
) {

    const counts = {};


    rows.forEach(
        row => {

            const value =
                row[field] ||
                "Unknown";


            counts[value] =

                (
                    counts[value] ||
                    0
                ) + 1;

        }
    );


    return Object
        .entries(counts)
        .sort(
            (a, b) =>
                b[1] - a[1]
        );

}



function createHorizontalChart(
    data,
    label,
    backgroundColor
) {

    return {

        type: "bar",

        data: {

            labels:

                data.map(
                    item =>
                        item[0]
                ),

            datasets: [

                {

                    label,

                    data:

                        data.map(
                            item =>
                                item[1]
                        ),

                    backgroundColor

                }

            ]

        },

        options: {

            ...getChartOptions(),

            indexAxis: "y"

        }

    };

}



function replaceChart(
    existingChart,
    canvasId,
    config
) {

    if (
        existingChart
    ) {

        existingChart.destroy();

    }


    const canvas =
        document.getElementById(
            canvasId
        );


    if (!canvas) {

        console.warn(
            `Canvas not found: ${canvasId}`
        );


        return null;

    }


    return new Chart(
        canvas,
        config
    );

}



function getChartOptions() {

    return {

        responsive: true,

        maintainAspectRatio: false,

        interaction: {

            mode: "index",

            intersect: false

        },

        plugins: {

            legend: {

                labels: {

                    color:
                        "#dbe5f5"

                }

            }

        },

        scales: {

            x: {

                beginAtZero: true,

                ticks: {

                    color:
                        "#dbe5f5",

                    precision: 0

                },

                grid: {

                    color:
                        "rgba(38, 57, 88, 0.75)"

                }

            },

            y: {

                beginAtZero: true,

                ticks: {

                    color:
                        "#dbe5f5"

                },

                grid: {

                    color:
                        "rgba(38, 57, 88, 0.75)"

                }

            }

        }

    };

}



function getMonthKey(row) {

    if (

        row.date &&

        /^\d{4}-\d{2}-\d{2}$/
            .test(row.date)

    ) {

        return row.date.substring(
            0,
            7
        );

    }


    if (
        row.month
    ) {

        const parsed =

            new Date(
                `${row.month} 1`
            );


        if (

            !Number.isNaN(
                parsed.getTime()
            )

        ) {

            return [

                parsed.getFullYear(),

                String(
                    parsed.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                )

            ].join("-");

        }

    }


    return "";

}



function formatMonthLabel(
    monthKey
) {

    const [
        year,
        month
    ] =

        monthKey.split("-");


    const date =

        new Date(

            Number(year),

            Number(month) - 1,

            1

        );


    return date.toLocaleDateString(

        "en-US",

        {

            month: "short",

            year: "numeric"

        }

    );

}



function displayDate(value) {

    if (!value) {

        return "";

    }


    if (

        !/^\d{4}-\d{2}-\d{2}$/
            .test(value)

    ) {

        return value;

    }


    const [
        year,
        month,
        day
    ] =

        value.split("-");


    return `${month}/${day}/${year}`;

}



function clearFilters() {

    document
        .getElementById("acoFilter")
        .value =
        "All";


    document
        .getElementById("startDate")
        .value =
        "";


    document
        .getElementById("endDate")
        .value =
        "";


    document
        .getElementById("nurseFilter")
        .value =
        "All";


    document
        .getElementById("practiceFilter")
        .value =
        "All";


    document
        .getElementById("overviewSearch")
        .value =
        "";


    document
        .getElementById("nurseSearch")
        .value =
        "";


    applyFilters();

}



function switchPage(
    pageName
) {

    const overviewPage = document.getElementById("overviewPage");
    const nursesPage = document.getElementById("nursesPage");
    const enrollment485Page = document.getElementById("enrollment485Page");
    const uploadFilters = document.getElementById("uploadFilters");

    if (overviewPage) overviewPage.classList.toggle("hidden", pageName !== "overview");
    if (nursesPage) nursesPage.classList.toggle("hidden", pageName !== "nurses");
    if (enrollment485Page) enrollment485Page.classList.toggle("hidden", pageName !== "enrollment485");
    if (uploadFilters) uploadFilters.classList.toggle("hidden", pageName === "enrollment485");

    document
        .querySelectorAll(".pageButton")
        .forEach(
            button => {

                button.classList.toggle(

                    "active",

                    button.dataset.page ===
                    pageName

                );

            }
        );

    updateHeaderTimestamp(pageName);

    setTimeout(
        function () {

            if (
                pageName === "overview"
            ) {

                updateOverviewCharts();

            }
            else if (
                pageName === "nurses"
            ) {

                updateNursesPage();

            }
            else if (
                pageName === "enrollment485"
            ) {

                renderPractice485AcoChart();
                applyPractice485Filters();

            }

        },
        50
    );

}


function updateHeaderTimestamp(pageName) {
    const dashboardData = window.DASHBOARD_DATA || {};
    const lastUpdated = document.getElementById("lastUpdated");
    if (!lastUpdated) return;

    let value = dashboardData.uploadLastUpdated || dashboardData.lastUpdated || "";

    if (pageName === "enrollment485") {
        value = practice485Data.lastUpdated || value;
    }

    lastUpdated.textContent = value
        ? `Updated: ${value}`
        : "Update time unavailable";
}


function initializePractice485Page() {
    const practices = Array.isArray(practice485Data.practices)
        ? practice485Data.practices
        : [];

    const metrics = practice485Data.metrics || {};

    setText("practice485Total", metrics.total ?? practices.length);
    setText("practice485Enrolled", metrics.enrolled ?? 0);
    setText("practice485Emr", metrics.emrCount ?? 0);
    setText("practice485NotEnrolled", metrics.notEnrolled ?? 0);
    setText("practice485Refused", metrics.refused ?? 0);

    const total = Number(metrics.total ?? practices.length) || 0;
    const enrolled = Number(metrics.enrolled ?? 0) || 0;
    setText(
        "practice485EnrolledPct",
        total > 0 ? `${((enrolled / total) * 100).toFixed(1)}% of total →` : "0% of total →"
    );

    fillPractice485Select(
        "practice485AcoFilter",
        practices.map(row => row.aco),
        "All ACOs"
    );

    fillPractice485Select(
        "practice485StatusFilter",
        practices.map(row => row.status),
        "All Statuses"
    );

    fillPractice485Select(
        "practice485ConsultantFilter",
        practices.map(row => row.consultant),
        "All Consultants"
    );

    renderPractice485AcoDetail();
    renderPractice485AcoChart();
    applyPractice485Filters();
}


function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value ?? "");
}


function fillPractice485Select(id, values, defaultText) {
    const select = document.getElementById(id);
    if (!select) return;

    const previousValue = select.value || "All";
    const uniqueValues = [...new Set(
        values
            .map(value => String(value || "").trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "All";
    defaultOption.textContent = defaultText;
    select.appendChild(defaultOption);

    uniqueValues.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });

    if ([...select.options].some(option => option.value === previousValue)) {
        select.value = previousValue;
    }
}


function getPractice485AcoColors() {
    return {
        CCPACO: "#667be8",
        NJPACO: "#7c4dff",
        CACO: "#3b82f6",
        OACO: "#16b889",
        ACPACO: "#ff9800",
        HCPACO: "#f44343"
    };
}


function getPractice485AcoCounts() {
    const practices = Array.isArray(practice485Data.practices)
        ? practice485Data.practices
        : [];

    const counts = {};
    practices.forEach(row => {
        const aco = String(row.aco || "Unknown").trim() || "Unknown";
        counts[aco] = (counts[aco] || 0) + 1;
    });

    return Object.entries(counts)
        .map(([aco, count]) => ({ aco, count }))
        .sort((a, b) => b.count - a.count);
}


function renderPractice485AcoDetail() {
    const container = document.getElementById("practice485AcoDetail");
    if (!container) return;

    const counts = getPractice485AcoCounts();
    const total = counts.reduce((sum, item) => sum + item.count, 0);
    const colors = getPractice485AcoColors();
    const selectedAco = document.getElementById("practice485AcoFilter")?.value || "All";

    container.innerHTML = "";

    counts.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "practice485AcoRow" + (selectedAco === item.aco ? " active" : "");

        const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0";
        const color = colors[item.aco] || "#667be8";

        button.innerHTML = `
            <span class="practice485AcoDot" style="background:${color}"></span>
            <span class="practice485AcoName">${escapeHtml(item.aco)}</span>
            <span class="practice485AcoCount">${item.count.toLocaleString()}</span>
            <span class="practice485AcoPct">${pct}%</span>
        `;

        button.addEventListener("click", function () {
            const select = document.getElementById("practice485AcoFilter");
            if (select) select.value = item.aco;
            practice485EmrOnly = false;
            setPractice485ActiveCard(null);
            applyPractice485Filters();
        });

        container.appendChild(button);
    });
}


function renderPractice485AcoChart() {
    if (typeof Chart === "undefined") return;

    const canvas = document.getElementById("practice485AcoChart");
    if (!canvas) return;

    if (practice485AcoChart) {
        practice485AcoChart.destroy();
    }

    const counts = getPractice485AcoCounts();
    const colors = getPractice485AcoColors();

    practice485AcoChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: counts.map(item => item.aco),
            datasets: [{
                data: counts.map(item => item.count),
                backgroundColor: counts.map(item => colors[item.aco] || "#667be8"),
                borderColor: "#0d1930",
                borderWidth: 3,
                hoverOffset: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "52%",
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = Number(context.raw) || 0;
                            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                            return `${context.label}: ${value} (${pct}%)`;
                        }
                    }
                }
            },
            onClick: function (_event, elements) {
                if (!elements.length) return;
                const index = elements[0].index;
                const item = counts[index];
                if (!item) return;

                const select = document.getElementById("practice485AcoFilter");
                if (select) select.value = item.aco;
                practice485EmrOnly = false;
                setPractice485ActiveCard(null);
                applyPractice485Filters();
            }
        }
    });
}


function practice485HasEmr(row) {
    return Boolean(String(row.emr || "").trim()) ||
        Boolean(Array.isArray(row.emrAccessNurses) && row.emrAccessNurses.length);
}


function applyPractice485Filters() {
    const practices = Array.isArray(practice485Data.practices)
        ? practice485Data.practices
        : [];

    const selectedAco = document.getElementById("practice485AcoFilter")?.value || "All";
    const selectedStatus = document.getElementById("practice485StatusFilter")?.value || "All";
    const selectedConsultant = document.getElementById("practice485ConsultantFilter")?.value || "All";
    const searchText = (document.getElementById("practice485Search")?.value || "")
        .trim()
        .toLowerCase();

    const filtered = practices.filter(row => {
        const matchesAco = selectedAco === "All" || row.aco === selectedAco;
        const matchesStatus = selectedStatus === "All" || row.status === selectedStatus;
        const matchesConsultant = selectedConsultant === "All" || row.consultant === selectedConsultant;
        const matchesEmr = !practice485EmrOnly || practice485HasEmr(row);

        const rowText = [
            row.aco,
            row.name,
            row.status,
            row.intake,
            row.format,
            row.emr,
            row.consultant,
            row.notes,
            ...(Array.isArray(row.emrAccessNurses) ? row.emrAccessNurses : [])
        ].join(" ").toLowerCase();

        const matchesSearch = !searchText || rowText.includes(searchText);

        return matchesAco && matchesStatus && matchesConsultant && matchesEmr && matchesSearch;
    });

    renderPractice485Table(filtered);
    renderPractice485AcoDetail();
}


function applyPractice485CardFilter(filterName) {
    const statusFilter = document.getElementById("practice485StatusFilter");
    if (!statusFilter) return;

    practice485EmrOnly = filterName === "emr";

    if (filterName === "all" || filterName === "emr") {
        statusFilter.value = "All";
    } else {
        const option = [...statusFilter.options].find(
            item => item.value.toLowerCase() === String(filterName).toLowerCase()
        );
        statusFilter.value = option ? option.value : "All";
    }

    setPractice485ActiveCard(filterName);
    applyPractice485Filters();
}


function setPractice485ActiveCard(filterName) {
    document.querySelectorAll("[data-485-card-filter]").forEach(button => {
        button.classList.toggle(
            "active",
            Boolean(filterName) && button.dataset["485CardFilter"] === filterName
        );
    });
}


function clearPractice485Filters() {
    const aco = document.getElementById("practice485AcoFilter");
    const status = document.getElementById("practice485StatusFilter");
    const consultant = document.getElementById("practice485ConsultantFilter");
    const search = document.getElementById("practice485Search");

    if (aco) aco.value = "All";
    if (status) status.value = "All";
    if (consultant) consultant.value = "All";
    if (search) search.value = "";

    practice485EmrOnly = false;
    setPractice485ActiveCard(null);
    applyPractice485Filters();
}


function getPractice485StatusClass(status) {
    const normalized = String(status || "").trim().toLowerCase();

    if (normalized === "enrolled") return "practice485StatusEnrolled";
    if (normalized === "not enrolled") return "practice485StatusNotEnrolled";
    if (normalized === "refused") return "practice485StatusRefused";
    if (normalized === "inactive") return "practice485StatusInactive";
    if (normalized === "pending") return "practice485StatusPending";
    return "practice485StatusOther";
}


function renderPractice485Table(rows) {
    const tbody = document.getElementById("practice485TableBody");
    const count = document.getElementById("practice485Count");
    if (!tbody || !count) return;

    count.textContent = `Showing ${rows.length.toLocaleString()} practice${rows.length === 1 ? "" : "s"}`;
    tbody.innerHTML = "";

    if (!rows.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="emptyMessage">No practices match the selected filters.</td>
            </tr>
        `;
        return;
    }

    [...rows]
        .sort((a, b) => {
            const acoCompare = String(a.aco || "").localeCompare(String(b.aco || ""));
            if (acoCompare !== 0) return acoCompare;
            return String(a.name || "").localeCompare(String(b.name || ""));
        })
        .forEach(row => {
            const tr = document.createElement("tr");
            const statusClass = getPractice485StatusClass(row.status);
            const hasEmr = practice485HasEmr(row);
            const nurses = Array.isArray(row.emrAccessNurses)
                ? row.emrAccessNurses.filter(Boolean)
                : [];

            let emrText = String(row.emr || "").trim();
            if (!emrText && hasEmr) emrText = "Confirmed";
            if (!emrText) emrText = "—";

            tr.innerHTML = `
                <td>${escapeHtml(row.aco || "")}</td>
                <td><strong>${escapeHtml(row.name || "")}</strong></td>
                <td>
                    <span class="practice485StatusBadge ${statusClass}">
                        ${escapeHtml(row.status || "")}
                    </span>
                </td>
                <td>${escapeHtml(row.intake || "")}</td>
                <td>${escapeHtml(row.format || "")}</td>
                <td>
                    <span class="practice485EmrBadge">
                        <span class="${hasEmr ? "practice485EmrYes" : ""}">${escapeHtml(emrText)}</span>
                        ${nurses.length ? `<span class="practice485EmrNurses">${escapeHtml(nurses.join(", "))}</span>` : ""}
                    </span>
                </td>
                <td>${escapeHtml(row.consultant || "")}</td>
                <td>${escapeHtml(row.notes || "")}</td>
            `;

            tbody.appendChild(tr);
        });
}



function showError(
    message
) {

    const box =
        document.getElementById(
            "errorMessage"
        );


    box.textContent =
        message;


    box.classList.remove(
        "hidden"
    );

}



function hideError() {

    document
        .getElementById("errorMessage")
        .classList
        .add(
            "hidden"
        );

}



function escapeHtml(value) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}