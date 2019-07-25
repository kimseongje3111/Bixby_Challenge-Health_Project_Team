function phoneFomatter(num){
  var formatNum = '';
  
  if(typeof(num) != 'undefined'){
    if(num.length == 11){
      formatNum = num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }else if(num.length == 8){
      formatNum = num.replace(/(\d{4})(\d{4})/, '$1-$2');
    }else{
      if(num.indexOf('02') == 0){
        formatNum = num.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
      }else{
        formatNum = num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      }
    }
  }

  return formatNum;
}

function timeFomatter(time){
  var formatTime = '';
  
  if(typeof(time) != 'undefined'){
    if(time.length == 4){
      if(Number(time.substring(0,2)) > 24){
        formatTime = '24시간 영업'
      }else{
        formatTime = '~ ' + time.substring(0,2) + ':' + time.substring(2,4);
      }
    }else{
      formatTime = '영업시간 알 수 없음'
    }
  }
  
  return formatTime;
}

function makeMapURL(lat, lon){
  var googleMapURL = 'https://www.google.com/maps/place/';
  
  return googleMapURL + lat + ',' + lon;
}

function makeRouteURL(lat1, lon1, lat2, lon2){
  var googleRouteURL = 'https://www.google.com/maps/dir/'
  
  return googleRouteURL + lat1 + ',' + lon1 + '/' + lat2 + ',' + lon2;
}

function getPharmacy(lat, lon){
  const console = require('console');
  const config = require('config');
  const secret = require('secret');
  const http = require('http');
  
  const pharmacyBaseUrl = config.get('pharmacybaseUrl');
  const serviceKey = secret.get('serviceKey');
  
  var options = {
    format : 'xmljs',
    headers : {
      'accept': 'application/xml'
    },
  };
  
  var wLon = "WGS84_LON=" + lon;
  var wLat = "WGS84_LAT=" + lat;
  var pharUrl = pharmacyBaseUrl + "Servicekey=" + serviceKey + "&" + wLon + "&" + wLat;
  
  var response = http.getUrl(pharUrl, options);
  var NOR = response.response.body.totalCount;
  var bodyItems = response.response.body.items;
  
  var lAllreqData = [];
  
  for(let i = 0; i < NOR; i++){
    if(bodyItems.item[i] != undefined){
      if(bodyItems.item[i].distance < 5){    // 거리가 5키로 이하일 때
        let dummyData = require("./data/PharmacyInfo.js");
        let dummyPointPoint = Object.assign({},{latitude:bodyItems.item[i].latitude, longitude:bodyItems.item[i].longitude});
        let dummyPoint = {point : dummyPointPoint};

        dummyData[0].point = Object.assign({}, dummyPoint);
        dummyData[0].distance = bodyItems.item[i].distance;
        dummyData[0].dutyaddr = bodyItems.item[i].dutyAddr;
        dummyData[0].dutyname = bodyItems.item[i].dutyName;
        dummyData[0].dutytel = phoneFomatter(bodyItems.item[i].dutyTel1);
        dummyData[0].endtime = timeFomatter(bodyItems.item[i].endTime);
        dummyData[0].url = makeMapURL(bodyItems.item[i].latitude, bodyItems.item[i].longitude);
        
        let deepCopy = Object.assign({},dummyData[0]);
        lAllreqData.push(deepCopy);
      }
    }
  }
  
  return lAllreqData;
}

module.exports.function = function getPharmacyInfo (point, pharmacyvocab, self) {
  const console = require('console');
  
  var result = [];
  var Data = getPharmacy(point.point.latitude, point.point.longitude);
   
  for(let i = 0; i < Data.length; i++){
    if(self.nameInfo != undefined){
      if(self.nameInfo.nickName){
        Data[i].username = self.nameInfo.nickName;
      }else{
        Data[i].username = self.nameInfo.structuredName;
      }
    }else{
        Data[i].username = '사용자';
    }
    
    let srclat = point.point.latitude;
    let srclon = point.point.longitude;
    let dstlat = Data[i].point.point.latitude;
    let dstlon = Data[i].point.point.longitude;
    
    Data[i].routeurl = makeRouteURL(srclat, srclon, dstlat, dstlon);
    Data[i].mypoint = Object.assign({},point);
    
    result.push(Data[i]);
  }
  
  return result;
}