// Set dimensions
const barMargin = { top: 50, right: 30, bottom: 70, left: 60 },
      barWidth = 800 - barMargin.left - barMargin.right,
      barHeight = 500 - barMargin.top - barMargin.bottom;

// Append SVG to the existing <div id="barchart">
const barSvg = d3.select("#barchart")
  .append("svg")
  .attr("width", barWidth + barMargin.left + barMargin.right)
  .attr("height", barHeight + barMargin.top + barMargin.bottom)
  .append("g")
  .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

// Load and process data
d3.csv("data/grocery_survey.csv.csv").then(data => {
  const nested = d3.rollups(
    data,
    v => v.length,
    d => d.Chain,
    d => d.PaymentMethod
  );

  const chains = Array.from(new Set(data.map(d => d.Chain)));
  const methods = Array.from(new Set(data.map(d => d.PaymentMethod)));

  const structured = chains.map(chain => {
    const values = {};
    methods.forEach(method => {
      values[method] = 0;
    });

    nested.forEach(([c, arr]) => {
      if (c === chain) {
        arr.forEach(([method, count]) => {
          values[method] = count;
        });
      }
    });

    return { Chain: chain, ...values };
  });

  const x0 = d3.scaleBand().domain(chains).range([0, barWidth]).padding(0.2);
  const x1 = d3.scaleBand().domain(methods).range([0, x0.bandwidth()]).padding(0.05);
  const y = d3.scaleLinear()
    .domain([0, d3.max(structured, d => d3.max(methods, m => d[m]))])
    .nice()
    .range([barHeight, 0]);

  const color = d3.scaleOrdinal().domain(methods).range(d3.schemeSet2);

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("padding", "8px")
    .style("background", "#ddd")
    .style("border-radius", "4px")
    .style("font-size", "12px");

  // Draw bars
  barSvg.append("g").selectAll("g")
    .data(structured)
    .join("g")
    .attr("transform", d => `translate(${x0(d.Chain)},0)`)
    .selectAll("rect")
    .data(d => methods.map(m => ({ key: m, value: d[m] })))
    .join("rect")
    .attr("x", d => x1(d.key))
    .attr("y", d => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", d => barHeight - y(d.value))
    .attr("fill", d => color(d.key))
    .on("mouseover", (event, d) => {
      tooltip
        .style("visibility", "visible")
        .html(`Payment: ${d.key}<br>Count: ${d.value}`);
    })
    .on("mousemove", event => {
      tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  // Add axes
  barSvg.append("g")
    .attr("transform", `translate(0,${barHeight})`)
    .call(d3.axisBottom(x0));

  barSvg.append("g")
    .call(d3.axisLeft(y));
});
