import * as d3 from 'd3';

export class CashflowBarChart {
    render(investmentSteps, renderDivRef) {
        const svgID = 'secondSVG';

        const marginW = 150,
            marginH = 40,
            width = 1000,
            height = 400;
        const barPaddingPercentage = 0.9;

        const zeroLineStrokeWidth = 3;

        // Reset diagram by deletion.
        renderDivRef.innerHTML = '';

        const svg = d3
            .select(renderDivRef)
            .append('svg')
            .attr('id', svgID)
            .attr('height', '100%')
            .attr('width', '100%')
            .attr('viewBox', `0 0 ${width + 2 * marginW} ${height + 2 * marginH}`)
            .append('g')
            .attr('transform', `translate(${[marginW, marginH]})`);

        // Create line array.
        const dataToIndex = {
            invested: 0,
            payout: 1,
        };

        const lineData = [[], []];
        for (const investmentStep of investmentSteps) {
            let sumNewInvestedMoney = 0;
            let sumNewPayout = 0;
            for (const etfIdentifier in investmentStep.newInvestedMoney) {
                sumNewInvestedMoney += investmentStep.newInvestedMoney[etfIdentifier];
                sumNewPayout += investmentStep.newPayout[etfIdentifier];
            }
            lineData[dataToIndex.invested].push({
                yStart: 0,
                yEnd: -sumNewInvestedMoney,
                date: investmentStep.date,
                cssClass: 'invested',
            });
            lineData[dataToIndex.payout].push({
                yStart: sumNewPayout,
                yEnd: 0,
                date: investmentStep.date,
                cssClass: 'payout',
            });
        }

        // Create scales.
        const minVal = d3.min(lineData[dataToIndex.invested].map(e => e.yEnd));
        const maxVal = d3.max(lineData[dataToIndex.payout].map(e => e.yStart));

        const yScale = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0]);
        const dateExtent = d3.extent(lineData[dataToIndex.invested], d => d.date);
        const xScale = d3.scaleTime().domain(dateExtent).range([0, width]);
        const rectWidth = (width / lineData[dataToIndex.invested].length) * barPaddingPercentage;

        // Draw axis.
        svg.append('g')
            .style('font-size', '20px')
            .call(d3.axisLeft(yScale).tickFormat(d => `${d.toLocaleString()} EUR`));

        svg.append('g')
            .style('font-size', '20px')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        // Draw zero line.
        svg.append('g')
            .append('line')
            .attr('x1', xScale(dateExtent[0]))
            .attr('y1', yScale(0))
            .attr('x2', xScale(dateExtent[1]))
            .attr('y2', yScale(0))
            .attr('stroke-width', zeroLineStrokeWidth)
            .attr('stroke', 'black');

        for (const barArray of lineData) {
            svg.selectAll(`rect.${barArray[0].cssClass}`)
                .data(barArray)
                .enter()
                .append('rect')
                .attr('class', d => d.cssClass)
                .attr('x', d => xScale(d.date))
                .attr('width', rectWidth)
                .attr('y', d => yScale(d.yStart))
                .attr('height', d => {
                    const a = yScale(d.yEnd) - yScale(d.yStart);
                    console.log(yScale(d.yStart), yScale(d.yEnd) - yScale(d.yStart), d.cssClass, d);
                    return a;
                });
        }
    }
}

export default CashflowBarChart;
