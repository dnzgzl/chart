'''
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
    var teams = lines[0].split(';'); 
    var categories = lines[1].split(';');
    
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
        'rgba(255,0,0,1)',
        'rgba(0,255,0,1)',
        'rgba(0,0,255,1)',
        'rgba(255,255,0,1)',
        'rgba(0,255,255,1)',
        'rgba(255,0,255,1)'
    ]
    var teamColors = {};
    for(var i = 0; i < chartData.teams.length; i++){
        var team = chartData.teams[i];
        teamColors[team] = colors[i];
    }
    return teamColors;
}

function createBubbleChartData(periodCount, xAxis, yAxis, radius){
    var bubbleChartData = {
        datasets: []
    };

    var teamColors = createTeamColors();

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
            backgroundColor: teamColors[team],
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,1)',
            data: teamData
        });
    }

    return bubbleChartData;
}

function periodTitle(index){
    return 'PERIODE ' + index;
}



function createChartOptions(periodCount, xAxis, yAxis, radius){
    return {
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
            duration: 4000,
            easing: 'linear',
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
        myChart.data = bubbleChartData;
        myChart.options = createChartOptions(periodCount, xAxis, yAxis, radius);
        myChart.update(0);
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
    csvToArray(data);//'Team 1;Team 2;Team 3;Team 4\nWerbungskosten;Absatz;Gewinn;Umsatz;F&E;Marketing\n100;30;240;340;50;25;150;25;300;450;10;20;50;25;200;250;30;40;20;75;450;470;15;35\n200;60;360;560;100;50;200;70;600;800;30;40;100;45;350;450;60;80;50;100;500;550;30;70\n150;25;200;350;150;75;100;40;200;300;50;60;230;35;450;680;90;120;200;20;250;450;45;105\n100;50;300;400;200;100;120;60;400;520;70;80;100;20;200;300;120;160;10;30;250;260;60;140\n250;70;300;550;250;125;170;80;350;520;90;100;50;100;450;500;150;200;80;150;750;830;75;175\n100;100;400;500;300;150;80;200;500;580;110;120;20;50;350;370;180;240;10;40;300;310;90;210');
    updateOptions();
    updateChart();
}

$(document).ready(function(){
    $.ajax({
        url: 'test.csv',
        datatype: "text",
        contentType: "charset=utf-8",
    }).done(afterReady);

afterReady();
});

'''
