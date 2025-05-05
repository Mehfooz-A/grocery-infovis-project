// Set up SVG dimensions
const margin = { top: 50, right: 50, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG
const svg = d3.select("#scatterplot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Load data
d3.csv("data/grocery_survey.csv.csv").then(data => {
  data.forEach(d => {
    d.Age = +d.Age;
    d.Income = +d.Income;
    d.PurchaseAmount = +d.PurchaseAmount;
  });

  // Create scales
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.Age)).range([0, width]);
  const y = d3.scaleLinear().domain(d3.extent(data, d => d.Income)).range([height, 0]);
  const color = d3.scaleSequential(d3.interpolateBlues)
                 .domain(d3.extent(data, d => d.PurchaseAmount));

  // Axes
  svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  svg.append("g").call(d3.axisLeft(y));
  svg.append("text").attr("x", width / 2).attr("y", height + 40).text("Age");
  svg.append("text").attr("transform", "rotate(-90)").attr("y", -40).attr("x", -height / 2).text("Income");

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("padding", "8px")
    .style("background", "#ddd")
    .style("border-radius", "4px")
    .style("font-size", "12px");

  // Points
  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.Age))
    .attr("cy", d => y(d.Income))
    .attr("r", 5)
    .attr("fill", d => color(d.PurchaseAmount))
    .attr("opacity", 0.7)
    .on("mouseover", (event, d) => {
      tooltip
        .style("visibility", "visible")
        .html(`Age: ${d.Age}<br>Income: $${d.Income}<br>Purchase: $${d.PurchaseAmount.toFixed(2)}`);
    })
    .on("mousemove", event => {
      tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));
});

  // Add brush
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on("start brush end", brushed);

  svg.append("g").call(brush);

  function brushed(event) {
    const selection = event.selection;
    svg.selectAll("circle").attr("stroke", null).attr("opacity", 0.3);

    if (selection) {
      const [[x0, y0], [x1, y1]] = selection;
      svg.selectAll("circle")
        .filter(d =>
          x(d.Age) >= x0 &&
          x(d.Age) <= x1 &&
          y(d.Income) >= y0 &&
          y(d.Income) <= y1
        )
        .attr("stroke", "black")
        .attr("opacity", 1.0);
    }
  }
