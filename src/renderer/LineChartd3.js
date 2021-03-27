import * as d3 from 'd3';
import { getTotalShareValue } from '../model/InvestmentModel';

export class LineChart3D {
    render(investmentSteps, renderDivRef) {
        const svgID = 'firstSVG';

        const marginW = 150,
            marginH = 40,
            width = 1000,
            height = 400;

        const etfLineColors = { IBM: { total: '#0562a0', dividend: '#71c1f7' } };
        const lineOpacity = 0.7;
        const lineStrokeWidth = 3;

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
            costs: 0,
            taxes: 1,
            inflation: 2,
        };
        let currentIdx = 3;
        const capitalIdentifier = 'capital';
        const dividendIdentifier = 'dividend';
        for (const etfIdentifier in investmentSteps[0].totalShares) {
            dataToIndex[etfIdentifier + dividendIdentifier] = currentIdx++;
            dataToIndex[etfIdentifier + capitalIdentifier] = currentIdx++;
        }

        const lineData = [];
        for (let i = 0; i < currentIdx; i++) {
            lineData.push([]);
        }
        for (const investmentStep of investmentSteps) {
            lineData[dataToIndex.costs].push({ value: -investmentStep.totalCosts, date: investmentStep.date });
            lineData[dataToIndex.taxes].push({
                value: -investmentStep.totalCosts - investmentStep.totalTaxes,
                date: investmentStep.date,
            });
            lineData[dataToIndex.inflation].push({
                value: -investmentStep.totalCosts - investmentStep.totalTaxes - investmentStep.inflation,
                date: investmentStep.date,
            });
            let heightOffset = 0;
            for (const etfIdentifier in investmentStep.totalShares) {
                const totalShareValue = getTotalShareValue(etfIdentifier, investmentStep);
                const totalDividendShareValue =
                    investmentStep.dividendTotalShares[etfIdentifier] * investmentStep.sharePrizes[etfIdentifier];
                lineData[dataToIndex[etfIdentifier + capitalIdentifier]].push({
                    value: totalShareValue + heightOffset,
                    date: investmentStep.date,
                });
                lineData[dataToIndex[etfIdentifier + dividendIdentifier]].push({
                    value: totalShareValue - totalDividendShareValue + heightOffset,
                    date: investmentStep.date,
                });
                heightOffset += totalShareValue;
            }
        }

        // Append miscellaneous data to array.
        lineData[dataToIndex.inflation].color = '#ff7f00';
        lineData[dataToIndex.taxes].color = '#e31a1c';
        lineData[dataToIndex.costs].color = '#be3bff';
        for (const etfIdentifier in investmentSteps[0].totalShares) {
            lineData[dataToIndex[etfIdentifier + dividendIdentifier]].color = etfLineColors[etfIdentifier].dividend;
            lineData[dataToIndex[etfIdentifier + capitalIdentifier]].color = etfLineColors[etfIdentifier].total;
        }

        // Create scales.
        const minVal = d3.min(lineData[dataToIndex.inflation].map(e => e.value));
        const maxVal = d3.max(lineData[lineData.length - 1].map(e => e.value));

        const yScale = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0]);
        const dateExtent = d3.extent(lineData[0], d => d.date);
        const xScale = d3.scaleTime().domain(dateExtent).range([0, width]);

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
            .style('stroke-width', lineStrokeWidth)
            .style('stroke', 'black');

        for (let i = 0; i < lineData.length; i++) {
            svg.append('path')
                .datum(lineData[i])
                .style('stroke', d => d.color)
                .style('stroke-width', lineStrokeWidth)
                .style('opacity', lineOpacity)
                .style('fill', 'none')
                .attr(
                    'd',
                    d3
                        .line()
                        .x(d => xScale(d.date))
                        .y(d => yScale(d.value))
                );
        }
    }
}

export default LineChart3D;
