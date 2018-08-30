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
    console.log("Data: ", data);
    var lines = data.split(/\r?\n|\r/);
    var teams = lines[0].split(';').filter((teamname) => teamname != '');
    var categories = lines[1].split(';');
    categories = categories.slice(0, categories.length/teams.length);

    var periodsData = createPeriodsRawData(lines);
    console.log(periodsData);
    var periods = createPeriods(periodsData, teams, categories);
    
    chartData.teams = teams;
    chartData.categories = categories;
    chartData.periods = periods;
    console.log(teams);
    console.log(categories);
    console.log(periods);
    console.log(chartData);
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

function createBubbleChartData(periodCount, xAxis, yAxis, radius){
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

    return bubbleChartData;
}

function periodTitle(index){
    return 'PERIODE ' + index;
}



function createChartOptions(periodCount, xAxis, yAxis, radius){
    var teamColors = createTeamColors();

    return {
        elements: {
            labelColor: function(context){
                return 'rgba(255,0,0,1)';
            },
            point: {
                backgroundColor: function(context){
                    var color = 'rgba('+ teamColors[context.datasetIndex] + ',' + (context.dataIndex + 1)/periodCount + ')';
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
                    beginAtZero:true
                }
            }],
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: xAxis + ' (€)'
                },
                ticks: {
                    beginAtZero:true
                }
            }]
        },
        animation: {
            duration: 1000,
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
        }
    }
}

var myChart = null;

function drawChart(bubbleChartData, periodCount, xAxis, yAxis, radius){
    var context = document.getElementById('canvas').getContext('2d');

    if(!myChart){
        myChart = new Chart(context, {
            type: 'bubble',
            data: bubbleChartData,
            options: createChartOptions(periodCount, xAxis, yAxis, radius)
        });
    } else {
        for(var i = 0; i < myChart.data.datasets.length; i++){
            myChart.data.datasets[i].data = bubbleChartData.datasets[i].data;
        }
        //myChart.data = bubbleChartData;
        myChart.options = createChartOptions(periodCount, xAxis, yAxis, radius);
        myChart.update();
    }
    
}

function selectedValue(htmlID){
    var selection = $('#' + htmlID)[0];
    return selection.options[selection.selectedIndex].value;
}

function updateChart(){
    var periodCount = selectedValue('period');
    console.log('PeriodCount: ' + periodCount);
    var xAxis = selectedValue('xAxis');
    var yAxis = selectedValue('yAxis');
    var radius = selectedValue('radius');

    var bubbleChartData = createBubbleChartData(periodCount, xAxis, yAxis, radius);
    drawChart(bubbleChartData, periodCount, xAxis, yAxis, radius);
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
