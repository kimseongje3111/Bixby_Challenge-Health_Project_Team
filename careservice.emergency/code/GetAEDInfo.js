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

function makeMapURL(lat, lon){
  var googleMapURL = 'https://www.google.com/maps/place/';
  
  return googleMapURL + lat + ',' + lon;
}

function makeRouteURL(lat1, lon1, lat2, lon2){
  var googleRouteURL = 'https://www.google.com/maps/dir/'
  
  return googleRouteURL + lat1 + ',' + lon1 + '/' + lat2 + ',' + lon2;
}

function getAED(lat, lon){
  const console = require('console');
  const config = require('config');
  const secret = require('secret');
  const http = require('http');
  
  const aedBaseUrl = config.get('aedbaseUrl');
  const serviceKey = secret.get('serviceKey');
  
  var options = {
    format : 'xmljs',
    headers : {
      'accept': 'application/xml'
    },
  };
  
  var wLon = "WGS84_LON=" + lon;
  var wLat = "WGS84_LAT=" + lat;
  var aedUrl = aedBaseUrl + "Servicekey=" + serviceKey + "&" + wLon + "&" + wLat;
  
  var response = http.getUrl(aedUrl, options);
  var NOR = response.response.body.numOfRows;
  var bodyItems = response.response.body.items;
  
  var lAllreqData = [];
  
  for(let i = 0; i < NOR; i++){
    if(bodyItems.item[i].distance < 2){    // 거리가 2키로 이하일 때
      let dummyData = require("./data/AEDInfo.js");
      let dummyPointPoint = Object.assign({},{latitude:bodyItems.item[i].wgs84Lat, longitude:bodyItems.item[i].wgs84Lon});
      let dummyPoint = {point : dummyPointPoint};
      
      dummyData[0].point = Object.assign({}, dummyPoint);
      dummyData[0].buildplace = bodyItems.item[i].buildPlace;
      dummyData[0].buildaddress = bodyItems.item[i].buildAddress;
      dummyData[0].clerktel = phoneFomatter(bodyItems.item[i].clerkTel);
      dummyData[0].managertel = phoneFomatter(bodyItems.item[i].managerTel);
      dummyData[0].distance = bodyItems.item[i].distance;
      dummyData[0].url = makeMapURL(bodyItems.item[i].wgs84Lat, bodyItems.item[i].wgs84Lon);
      
      let deepCopy = Object.assign({},dummyData[0]);
      lAllreqData.push(deepCopy);
    }
  }
  
  return lAllreqData;
}

module.exports.function = function getAEDInfo (point, aedvocab, self) {
  const console = require('console');
  
  var result = [];
  var Data = getAED(point.point.latitude, point.point.longitude);
  
  for(let i = 0; i < Data.length; i++){
    if(i > 2) {
      break;
    }
    
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
