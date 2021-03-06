$(function() {
  //document.getElementById('viewres').style.visibility='hidden';
document.getElementById('viewres').style.display='none';
document.getElementById('viewlog').style.display='none';
document.getElementById('computing').style.display='none';
  CodeMirror.defineMode("diff", function() {
    var keywords = wordRegexp(['extern','import','fixed','distinct','random','origin','param','type', 'obs', 'query', 'for', 'forall','exists', 'if', 'then', 'else', 'null']);
    var types = wordRegexp(['Integer', 'Real', 'Boolean', 'NaturalNum', 'String', 'List', 'Map', 'RealMatrix', 'IntMatrix', 'TabularCPD','Categorical']);

    function wordRegexp(words) {
      return new RegExp("^((" + words.join(")|(") + "))\\b");
    }

    return {
      token: function(stream){
        if (stream.eatSpace()) return null;
        if (stream.match(keywords)) return 'keyword';
        if (stream.match(types)) return 'tag';
        if (stream.match(/[:=~]/)) return 'atom';
        stream.next();
        return null;
      }
    };
  });

  CodeMirror.defineMIME("text/x-diff", "diff");

 editor = CodeMirror.fromTextArea($('#textfield')[0], {

    lineNumbers: true,
    matchBrackets: true
  });

 num=0;

//editor.setOption("theme", "railscasts");
  $(".button").click(function() {
    document.getElementById('viewres').style.display='none';
      document.getElementById('viewlog').style.display='none';
    document.getElementById('computing').style.display='initial';
    var input_string = editor.getValue();
    var samp_base = $('input[name=samp_base]:checked').val();
    var samp_eng = $('input[name=samp_eng]:checked').val();
    var samp_alg = $('input[name=samp_alg]:checked').val();
    var input_data = {"textfield" : input_string, "base" : samp_base, "eng" : samp_eng, "alg" : samp_alg};
    re = /@/i;
    var found = input_string.match(re);
    if(found==null&&samp_eng=="ParticleFilter"){
      alert(" ParticleFilter can only be used to dynamic models!");
      return false;
    }
    /*
    var i;
    for (i=1;i<=num;i++ ){
      var chartname='#chardiv'+i.toString();
      $("#chartdiv"+i.toString()).css({"height"		: "0px"});
      //console.log(AmCharts.charts);
      for(key in AmCharts.charts)
        AmCharts.charts[key].clear();
    }*/
    num=0;
    glb_title = [];
    glb_dist = [];
    glb_samples = [];
    $.ajax({
      type: "POST",
      data: input_data,
      success: function(data) {
        //console.log(data);
        //console.log(eval(data));
        //console.log(eval(data));
        if (data=="error occurred"){
          alert(data);
          return false;
        }
        var real_data= eval(data);
        $('#logtext').val(real_data[1]);
        real_data=real_data[0];
        glb_title = [];
        glb_dist = [];
        glb_samples = [];
        num=0;
        $("#choosedata").empty();
        //console.log(data);
        for (key1 in real_data)
          if(real_data.hasOwnProperty(key1)){
          var samples = real_data[key1]['samples']
          var queries = real_data[key1]['queries']
          for(key in queries){
            if(queries.hasOwnProperty(key)){
              num+=1;
              var title = queries[key]['query'];
              var dist = queries[key]['distribution'];
              glb_dist.push(dist);
              glb_title.push(title);
              glb_samples.push(samples);
              $("#choosedata").append($("<option />").val(num-1).text(title));
            }
          }
        }
        google.visualization.events.addOneTimeListener(ChartC, 'ready',function(){
          document.getElementById('viewres').style.display='initial';
            document.getElementById('viewlog').style.display='initial';
          document.getElementById('computing').style.display='none';}
              );
        showchart(glb_samples[0],glb_title[0], glb_dist[0]);
        //$('#results').html($(data));
      },
    });

    return false;
  });
});
google.charts.load('44', {'packages':['corechart']});
google.charts.setOnLoadCallback(showchart);

var days;
var report='activity';
movie_flag=false;
num_flag=0;
function getChart() {
  return google.visualization.ColumnChart;
}
function isNumber (value) {
return typeof value === 'number' && isFinite(value);
};
function drawChart(Chart, jsonData, title, samples) {
  if (jsonData==null)
    jsonData=[];
  //  console.log(jsonData[1][0]);
  var dataTable = new google.visualization.arrayToDataTable(jsonData,false);

  var e = document.getElementById("DelayDiv");
  var delay = 1000;
  var total = 0;
  if(jsonData.length>1&&isNumber(jsonData[1][0])){
    Chart.setChartType('LineChart');
  }else
  Chart.setChartType('ColumnChart');
  Chart.setDataTable(dataTable);
  Chart.setOptions({
      title: title+" w/ "+samples+" samples",
      titleFontSize:15,
      vAxis: {minValue:0, maxValue:100},
        height: 400,
        width: 600,
      animation: {
        duration: delay,
        easing: 'linear',
        startup: true
      },
      legend: {position: 'none'}
  });
  if (movie_flag){
    movie_flag=false;
    //console.log('got here'+num_flag.toString());
    google.visualization.events.addOneTimeListener(Chart.getChart(), 'animationfinish',function(){movie(num_flag);});}
  Chart.draw();

}
function showhide() {
    var x = document.getElementById("usrtext");
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}
function getval(selbox){
  $.ajax({
    type: "POST",
    data: {sel_file : selbox.value},
    success: function(data) {
      editor.setValue(data);
      //console.log(eval(data));
      //$('#results').html($(data));
    },
  });
}
function handlebase(myradio){
//  $("#sampno").slider("destroy");
  $("#sampno").prop({"max":parseInt(myradio.value)*2});
  $("#sampno").val(parseInt(myradio.value));
var output = document.getElementById("demo");
output.innerHTML = slider.value;
}
var ChartC;
function showchart(samples,title, dist){

if ( ChartC == null ) {
			//gv = getChart();
			ChartC = new google.visualization.ChartWrapper({
     containerId: 'chartdiv'
 });
		}
		drawChart(ChartC, dist, title,samples);

}
function refresh(){
  var e = document.getElementById("choosedata");
	var chtid = e.options[e.selectedIndex].value;
  showchart(glb_samples[chtid],glb_title[chtid],glb_dist[chtid])
}
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}
function movie(i){
    if (i==0) return;
    console.log(num-i);
    $("#choosedata").val(num-i);
    movie_flag=true;
    num_flag=i-1;
    showchart(glb_samples[num-i],glb_title[num-i],glb_dist[num-i]);
}
var slider = document.getElementById("sampno");
var output = document.getElementById("demo");
output.innerHTML = slider.value;

slider.oninput = function() {
  output.innerHTML = this.value;
}
