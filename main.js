function createPeriodsRawData(lines){
    var periodsData = [];
    for(var i = 0; i < 6; i++){
        var numberData = lines[i + 2].split(';').map((value) => parseInt(value));
        periodsData.push(numberData);
    }
    return periodsData;
}

function createPeriods(rawData, teams, categories){
    var periods = [];
    for(var i = 0; i < 6; i++){
        var period = {};
        for(var team of teams){
            period[team] = {};
            for(var category of categories){
                period[team][category] = rawData[i][0];
                rawData[i].shift();
            }
        }
        periods.push(period);
    }
    return periods;
}

var chartData = {};

function csvToArray(data){
    var lines = data.split(/\r?\n|\r/);
    var teams = lines[0].split(';').filter((teamname) => teamname != '');
    var categories = lines[1].split(';');
    categories = categories.slice(0, categories.length/teams.length);
    var periodsData = createPeriodsRawData(lines);
    var periods = createPeriods(periodsData, teams, categories);

    chartData.teams = teams;
    chartData.categories = categories;
    chartData.periods = periods;
    console.log("Teams: ",teams);
    console.log("Categories: ",categories);
    console.log("Periods: ",periods);
    console.log("chartData: ",chartData);
}

function createTeamColors(){
    var colors = [
        '255,0,0',
        '0,255,0',
        '0,0,255',
        '255,255,0',
        '0,255,255',
        '255,0,255'
    ]
    return colors;
}

function reduceAxis(periodCount, axis, fun, initialValue){
    var result = initialValue;
    for(var periodIndex = 0; periodIndex < periodCount; periodIndex++){
        var period = chartData.periods[periodIndex];
        for(var team of chartData.teams){
            result = fun(result, period[team][axis]);
        }
    }
    return result;
}

function regressionOverall(x, periodCount, xAxis, yAxis){
    var sumX = reduceAxis(periodCount, xAxis, (a, b) => a + b, 0);
    var sumY = reduceAxis(periodCount, yAxis, (a, b) => a + b, 0);
    var sumXSquared = reduceAxis(periodCount, xAxis, (a, b) => a + Math.pow(b, 2), 0);
    var axisMultiplication = 0;
    for(var periodIndex = 0; periodIndex < periodCount; periodIndex++){
        var period = chartData.periods[periodIndex];
        for(var team of chartData.teams){
            axisMultiplication += period[team][xAxis] * period[team][yAxis];
        }
    }
    var n = periodCount * chartData.teams.length;
    var a = (sumXSquared*sumY - sumX*axisMultiplication) / (n * sumXSquared - Math.pow(sumX, 2));
    var b = (n * axisMultiplication - sumX*sumY) / (n * sumXSquared - Math.pow(sumX, 2));
    return a + b * x;
}

function addRegressionToData(bubbleChartData, periodCount, xAxis, yAxis){
    var minX = 0;
    var regressionStart = regressionOverall(minX, periodCount, xAxis, yAxis);
    var maxX = 0;
    for(var periodIndex = 0; periodIndex < periodCount; periodIndex++){
        var period = chartData.periods[periodIndex];
        for(var team of chartData.teams){
            var newMax = period[team][xAxis];
            maxX = newMax > maxX ? newMax : maxX;
        }
    }

    var regressionEnd = regressionOverall(maxX, periodCount, xAxis, yAxis);

    bubbleChartData.datasets.push({
        label: 'Regression',
        data: [{x: minX, y: regressionStart}, {x: maxX, y: regressionEnd}],
        type: 'line',
        backgroundColor: 'rgba(50, 50, 50, 1)',
        borderColor: 'rgba(50, 50, 50, 1)',
        fill: false,
        pointRadius: 0
    });
}

function createCoefficient(periodCount, xAxis, yAxis){
    var sumX = reduceAxis(periodCount, xAxis, (a, b) => a + b, 0);
    var sumY = reduceAxis(periodCount, yAxis, (a, b) => a + b, 0);
    var n = periodCount * chartData.teams.length;
    var xAvg = sumX / n;
    var yAvg = sumX / n;
    var numerator = 0;
    for(var periodIndex = 0; periodIndex < periodCount; periodIndex++){
        var period = chartData.periods[periodIndex];
        for(var team of chartData.teams){
            numerator += (period[team][xAxis] - xAvg) * (period[team][yAxis] - yAvg);
        }
    }
    var denominator =  reduceAxis(periodCount, xAxis, (result, xi) => result + Math.pow(xi - xAvg, 2), 0);
    denominator *= reduceAxis(periodCount, yAxis, (result, yi) => result + Math.pow(yi - yAvg, 2), 0)
    denominator = Math.sqrt(denominator);
    return numerator / denominator;
}

function createBubbleChartData(periodCount, xAxis, yAxis, radius, regression){
    var bubbleChartData = {
        datasets: []
    };

    var teamColors = createTeamColors();
    var teamIndex = 0;

    for(var team of chartData.teams){
        var teamData = []
        for(var periodIndex = 0; periodIndex < periodCount; periodIndex++){
            var period = chartData.periods[periodIndex];
            teamData.push({
                x: period[team][xAxis],
                y: period[team][yAxis],
                r: radius ? period[team][radius] / 3.0 : 20
            });
        }

        bubbleChartData.datasets.push({
            label: team,
            borderWidth: 2,
            borderColor: 'rgba(' + teamColors[teamIndex] + ',1)',
            data: teamData
        });
        teamIndex++;
    }

    if(regression){
        addRegressionToData(bubbleChartData, periodCount, xAxis, yAxis);
    }
    return bubbleChartData;
}

function periodTitle(index){
    return 'PERIODE ' + index;
}

function createChartOptions(periodCount, xAxis, yAxis, radius, animationTime){
    var teamColors = createTeamColors();

    return {
        elements: {
            point: {
                backgroundColor: function(context){
                    var time = selectedValue('time');
                    if(time){
                        var color = 'rgba('+ teamColors[context.datasetIndex] + ',' + (context.dataIndex + 1)/periodCount + ')';
                    } else {
                        var color = 'rgba('+ teamColors[context.datasetIndex] + ',1)';
                    }

                    return color;
                }
            }
        },
        responsive: true,
        showLines: true,
        title: {
            display: true,
            text: periodTitle(periodCount) + ': Vergleich ' + xAxis + ' & ' + yAxis + (radius ? ' (Kreisgröße = ' + radius + ')' : ''),
        },
        tooltips: {
            mode: 'point'
        },
        scales: {
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: yAxis + ' (€)'
                },
                ticks: {
                    beginAtZero:true,
                }
            }],
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: xAxis + ' (€)',

                },
                ticks: {
                    beginAtZero:true,
                }
            }]
        },
        animation: {
            duration: animationTime,
            easing: 'easeInOutQuad',
        },
        layout: {
            padding: {
                left: 50,
                right: 50,
                top: 50,
                bottom: 50,
            }
        },
        legend: {
            display: true,
            position: 'bottom',
        },
        maintainAspectRatio: true,
    }
}

var myChart = null;
var currentPeriodCount = 1;
var runningTimer = null;

function drawChart(periodCount, xAxis, yAxis, radius, regression, animationTime){
    console.log('Animation time: ', animationTime);
    if(Math.abs(periodCount - currentPeriodCount) > 1 ){
        delayedPeriodCount = periodCount;
        clearTimeout(runningTimer);
        runningTimer = setTimeout(function(){
            drawChart(delayedPeriodCount, xAxis, yAxis, radius, regression, animationTime);
        }, animationTime);
        if(currentPeriodCount > periodCount){
            periodCount = currentPeriodCount - 1;
        }
        else {
            periodCount = currentPeriodCount + 1;
        }
    }
    currentPeriodCount = periodCount;

    var bubbleChartData = createBubbleChartData(periodCount, xAxis, yAxis, radius, regression);

    var context = document.getElementById('canvas').getContext('2d');
    if(!myChart){
        myChart = new Chart(context, {
            type: 'bubble',
            data: bubbleChartData,
            options: createChartOptions(periodCount, xAxis, yAxis, radius, animationTime)
        });
    } else {
        while(myChart.data.datasets.length > bubbleChartData.datasets.length){
            myChart.data.datasets.pop();
        }
        while(myChart.data.datasets.length < bubbleChartData.datasets.length){
            myChart.data.datasets.push(bubbleChartData.datasets[myChart.data.datasets.length]);
        }

        for(var i = 0; i < myChart.data.datasets.length; i++){
            myChart.data.datasets[i].data = bubbleChartData.datasets[i].data;
        }
        myChart.options = createChartOptions(periodCount, xAxis, yAxis, radius, animationTime);
        myChart.update();
    }
}

function selectedValue(htmlID){
    var selection = $('#' + htmlID)[0];
    return selection.options[selection.selectedIndex].value;
}

function updateChart(){
    console.log('Update Chart');
    var periodCount = parseInt(selectedValue('period'));
    var xAxis = selectedValue('xAxis');
    var yAxis = selectedValue('yAxis');
    var radius = selectedValue('radius');
    var regression = selectedValue('regression');
    var animationTime = parseInt(selectedValue('animation'));

    $('#correlationcoeff')[0].innerHTML = createCoefficient(periodCount, xAxis, yAxis);

    drawChart(periodCount, xAxis, yAxis, radius, regression, animationTime);
}

function addCategoriesToSelection(selection){
    for(var category of chartData.categories){
        var option = document.createElement("option");
        option.text = category;
        option.value = category;
        option.onclick = updateChart;
        selection.add(option);
    }
}

function addPeriodsToSelection(selection){
    for(var periodIndex = 0; periodIndex < chartData.periods.length; periodIndex++){
        var option = document.createElement("option");
        option.text = periodTitle(periodIndex + 1);
        option.value = periodIndex + 1;
        option.onclick = updateChart;
        selection.add(option);
    }
}

function updateOptions(){
    addCategoriesToSelection($('#xAxis')[0]);
    addCategoriesToSelection($('#yAxis')[0]);
    addCategoriesToSelection($('#radius')[0]);
    addPeriodsToSelection($('#period')[0]);
}

function afterReady (data){
    csvToArray(data);
    updateOptions();
    updateChart();
}

$(document).ready(function(){
    $.ajax({
        url: 'test.csv',
        datatype: "text",
        contentType: "charset=utf-8",
    }).done(afterReady);
});
