// Set dimensions
const boxMargin = { top: 50, right: 30, bottom: 70, left: 60 },
      boxWidth = 800 - boxMargin.left - boxMargin.right,
      boxHeight = 500 - boxMargin.top - boxMargin.bottom;

// Append SVG
const boxSvg = d3.select("#boxplot")
  .append("svg")
  .attr("width", boxWidth + boxMargin.left + boxMargin.right)
  .attr("height", boxHeight + boxMargin.top + boxMargin.bottom)
  .append("g")
  .attr("transform", `translate(${boxMargin.left},${boxMargin.top})`);

d3.csv("data/grocery_survey.csv.csv").then(data => {
  data.forEach(d => {
    d.FamilySize = +d.FamilySize;
    d.PurchaseAmount = +d.PurchaseAmount;
  });

  const familySizes = Array.from(new Set(data.map(d => d.FamilySize))).sort((a, b) => a - b);

  const dataGrouped = familySizes.map(family => {
    const group = data.filter(d => d.FamilySize === family).map(d => d.PurchaseAmount).sort(d3.ascending);
    const q1 = d3.quantile(group, 0.25);
    const median = d3.quantile(group, 0.5);
    const q3 = d3.quantile(group, 0.75);
    const iqr = q3 - q1;
    const min = q1 - 1.5 * iqr;
    const max = q3 + 1.5 * iqr;

    return {
      FamilySize: family,
      q1, median, q3, iqr, min, max,
      outliers: group.filter(v => v < min || v > max)
    };
  });

  const x = d3.scaleBand()
    .range([0, boxWidth])
    .domain(familySizes)
    .paddingInner(0.2)
    .paddingOuter(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.PurchaseAmount)])
    .nice()
    .range([boxHeight, 0]);

  boxSvg.append("g")
    .attr("transform", `translate(0,${boxHeight})`)
    .call(d3.axisBottom(x).tickFormat(d => `Family ${d}`));

  boxSvg.append("g").call(d3.axisLeft(y));

  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("padding", "8px")
    .style("background", "#eee")
    .style("border", "1px solid #999")
    .style("border-radius", "5px")
    .style("font-size", "12px");

  // Draw boxes
  boxSvg.selectAll("boxes")
    .data(dataGrouped)
    .join("rect")
    .attr("x", d => x(d.FamilySize))
    .attr("y", d => y(d.q3))
    .attr("height", d => y(d.q1) - y(d.q3))
    .attr("width", x.bandwidth())
    .attr("stroke", "#333")
    .attr("fill", "#69b3a2")
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      tooltip
        .style("visibility", "visible")
        .html(`Click to filter Family Size ${d.FamilySize}<br>Median: $${d.median.toFixed(2)}`);
    })
    .on("mousemove", event => {
      tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"))
    .on("click", (event, d) => {
      window.dispatchEvent(new CustomEvent("boxplotFamilySelected", {
        detail: d.FamilySize
      }));
    });

  // Median lines
  boxSvg.selectAll("medianLines")
    .data(dataGrouped)
    .join("line")
    .attr("x1", d => x(d.FamilySize))
    .attr("x2", d => x(d.FamilySize) + x.bandwidth())
    .attr("y1", d => y(d.median))
    .attr("y2", d => y(d.median))
    .attr("stroke", "black");

  // Whiskers
  boxSvg.selectAll("minLines")
    .data(dataGrouped)
    .join("line")
    .attr("x1", d => x(d.FamilySize) + x.bandwidth() / 2)
    .attr("x2", d => x(d.FamilySize) + x.bandwidth() / 2)
    .attr("y1", d => y(d.min))
    .attr("y2", d => y(d.max))
    .attr("stroke", "black");

  // Outliers
  boxSvg.selectAll("outliers")
    .data(dataGrouped.flatMap(d => d.outliers.map(v => ({ FamilySize: d.FamilySize, value: v }))))
    .join("circle")
    .attr("cx", d => x(d.FamilySize) + x.bandwidth() / 2)
    .attr("cy", d => y(d.value))
    .attr("r", 3)
    .attr("fill", "red");
});