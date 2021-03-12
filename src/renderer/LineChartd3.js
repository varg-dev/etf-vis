import * as d3 from 'd3';

export class LineChart3D {
    render(visualizationModel, renderDivRef) {
        const svgID = 'firstSVG';
        const investedMoneyLineID = 'investedMoney';

        const marginW = 150,
            marginH = 40,
            width = 1000,
            height = 400;

        const zeroLineStrokeWidth = 3;

        const svg = d3
            .select(renderDivRef)
            .append('svg')
            .attr('id', svgID)
            .attr('height', '100%')
            .attr('width', '100%')
            .attr('viewBox', `0 0 ${width + 2 * marginW} ${height + 2 * marginH}`)
            .append('g')
            .attr('transform', `translate(${[marginW, marginH]})`);

        // create line array

        const dataToIndex = {
            costs: 0,
            taxes: 1,
            inflation: 2,
        };
        let currentIdx = 3;
        const capitalIdentifier = 'capital';
        const dividendIdentifier = 'dividend';
        for (const etfIdentifier in visualizationModel.etfIdentifierToRatio) {
            dataToIndex[etfIdentifier + dividendIdentifier] = currentIdx++;
            dataToIndex[etfIdentifier + capitalIdentifier] = currentIdx++;
        }

        const lineData = [];
        for (let i = 0; i < currentIdx; i++) {
            lineData.push([]);
        }
        for (const yearModel of visualizationModel.yearModels) {
            lineData[dataToIndex.costs].push({ value: -yearModel.values.costs, date: yearModel.endDate });
            lineData[dataToIndex.taxes].push({
                value: -yearModel.values.taxes - yearModel.values.costs,
                date: yearModel.endDate,
            });
            lineData[dataToIndex.inflation].push({
                value: -yearModel.values.inflation - yearModel.values.taxes - yearModel.values.costs,
                date: yearModel.endDate,
            });
            let heightOffset = 0;
            for (const etfIdentifier in visualizationModel.etfIdentifierToRatio) {
                lineData[dataToIndex[etfIdentifier + capitalIdentifier]].push({
                    value: yearModel.values.etfs[etfIdentifier].capital + heightOffset,
                    date: yearModel.endDate,
                });
                lineData[dataToIndex[etfIdentifier + dividendIdentifier]].push({
                    value: yearModel.values.etfs[etfIdentifier].dividend + heightOffset,
                    date: yearModel.endDate,
                });
                heightOffset += yearModel.values.etfs[etfIdentifier].capital;
            }
        }

        // Append miscellaneous data to array.
        lineData[dataToIndex.inflation].cssClass = 'inflation'; 
        lineData[dataToIndex.taxes].cssClass = 'taxes'; 
        lineData[dataToIndex.costs].cssClass = 'costs';
        for (const etfIdentifier in visualizationModel.etfIdentifierToRatio) {
            lineData[dataToIndex[etfIdentifier + capitalIdentifier]].cssClass = `${etfIdentifier}_dividend`;
            lineData[dataToIndex[etfIdentifier + capitalIdentifier]].cssClass = `${etfIdentifier}_total_amount`;
        }

        // create scales
        const minVal = d3.min(lineData[dataToIndex.inflation].map(e => e.value));
        const maxVal = d3.max(lineData[lineData.length - 1].map(e => e.value));

        const yScale = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0]);

        const xScale = d3
            .scaleTime()
            .domain([visualizationModel.dates[0], visualizationModel.nextFutureDate])
            .range([0, width]);

        // Draw axis
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
            .attr('x1', xScale(visualizationModel.dates[0]))
            .attr('y1', yScale(0))
            .attr('x2', xScale(visualizationModel.nextFutureDate))
            .attr('y2', yScale(0))
            .attr('stroke-width', zeroLineStrokeWidth)
            .attr('stroke', 'black');

        for (let i = 0; i < lineData.length; i++){

        
        svg.append('path')
            .datum(lineData[i])
            .attr('fill', 'none')
            .attr('class', d => d.cssClass)
            .attr('stroke-width', 3)
            .attr(
                'd',
                d3
                    .line()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.value))
            );
        }

        /*const xWidth = (width / this.dates.length) * 0.9;

        for (let i = 0; i < this.yearModels.length; i++) {
            const yearModel = this.yearModels[i];
            const x = yearModel.date;
            const currentYearClass = x.toDateString().split(' ').join('_');
            const data = yearModel.getD3Representation().bars;
            svg.selectAll(`rect.${currentYearClass}`)
                .append('g')
                .attr('class', currentYearClass)
                .data(data)
                .enter()
                .append('rect')
                .attr('x', xScale(x))
                .attr('y', d => yScale(d.yStart))
                .attr('width', xWidth)
                .attr('height', d => yScale(d.yEnd) - yScale(d.yStart))
                .attr('class', d => d.class);
        }
        // Draw axis
        svg.append('g')
            .style('font-size', '20px')
            .call(d3.axisLeft(yScale).tickFormat(d => `${d.toLocaleString()} EUR`));

        svg.append('g')
            .style('font-size', '20px')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        svg.append('g')
            .append('line')
            .attr('x1', xScale(this.dates[0]))
            .attr('y1', yScale(0))
            .attr('x2', xScale(this.nextFutureDate))
            .attr('y2', yScale(0))
            .attr('stroke-width', zeroLineStrokeWidth)
            .attr('stroke', 'black');

        // Draw invested Money line.
        const moneyDataArray = renderData.map(e => e.investedMoney);
        moneyDataArray.unshift({ date: this.dates[0], money: this.startCapital });

        svg.append('path')
            .datum(moneyDataArray)
            .attr('fill', 'none')
            .attr('id', investedMoneyLineID)
            .attr('stroke-width', 3)
            .attr(
                'd',
                d3
                    .line()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.money))
            );*/
    }
}

export default LineChart3D;
