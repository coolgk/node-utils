'use strict';
exports.__esModule = true;
/*
example:

let request = require('request.js');

request.get('https://httpbin.org/get?a=b').then((respose) => {
    console.dir(respose.statusCode, {colors:true});
    console.dir(respose.headers, {colors:true});
    console.dir(respose.data, {colors:true});
    // if respose.data is a json string, respose.json will return the json object
    console.dir(respose.json, {colors:true});
});

request.post('https://httpbin.org/post?a=b').then((respose) => {
    console.dir(respose.statusCode, {colors:true});
    console.dir(respose.headers, {colors:true});
    console.dir(respose.data, {colors:true});
    // if respose.data is a json string, respose.json will return the json object
    console.dir(respose.json, {colors:true});
});

*/
var url = require("url");
;
/**
 * @param {object} options
 * @param {object} options.data - post data e.g. form data or files
 * @param {object} options.headers - http headers
 * @param {string} options.method - POST GET etc
 */
function send(urlString, options) {
    if (options === void 0) { options = {}; }
    return new Promise(function (resolve, reject) {
        options = Object.assign(url.parse(urlString), options);
        var request = require(options.protocol === 'http:' ? 'http' : 'https').request(options, function (response) {
            response.setEncoding('utf8');
            var data = '';
            response.on('data', function (chunk) { return data += chunk; });
            response.on('end', function () {
                resolve({
                    statusCode: response.statusCode,
                    headers: response.headers,
                    data: data,
                    get json() {
                        return JSON.parse(data);
                    }
                });
            });
        });
        request.on('error', function (error) {
            reject(error);
        });
        if (options.data) {
            request.write(options.data);
        }
        request.end();
    });
}
exports.send = send;
Request = {};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQUViOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFxQkU7QUFFRix5QkFBMkI7QUFNMUIsQ0FBQztBQUVGOzs7OztHQUtHO0FBQ0gsY0FBc0IsU0FBaUIsRUFBRSxPQUFZO0lBQVosd0JBQUEsRUFBQSxZQUFZO0lBQ2pELE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBQy9CLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFdkQsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsVUFBQyxRQUFRO1lBQzdGLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDN0IsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ2QsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsVUFBQyxLQUFLLElBQUssT0FBQSxJQUFJLElBQUksS0FBSyxFQUFiLENBQWEsQ0FBQyxDQUFDO1lBQzlDLFFBQVEsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFO2dCQUNmLE9BQU8sQ0FBQztvQkFDSixVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVU7b0JBQy9CLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTztvQkFDekIsSUFBSSxFQUFFLElBQUk7b0JBQ1YsSUFBSSxJQUFJO3dCQUNKLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM1QixDQUFDO2lCQUNKLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFDLEtBQUs7WUFDdEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRUQsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQTlCRCxvQkE4QkM7QUFFRCxPQUFPLEdBQUcsRUF3QlQsQ0FBQyIsImZpbGUiOiJyZXF1ZXN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG4vKlxuZXhhbXBsZTpcblxubGV0IHJlcXVlc3QgPSByZXF1aXJlKCdyZXF1ZXN0LmpzJyk7XG5cbnJlcXVlc3QuZ2V0KCdodHRwczovL2h0dHBiaW4ub3JnL2dldD9hPWInKS50aGVuKChyZXNwb3NlKSA9PiB7XG4gICAgY29uc29sZS5kaXIocmVzcG9zZS5zdGF0dXNDb2RlLCB7Y29sb3JzOnRydWV9KTtcbiAgICBjb25zb2xlLmRpcihyZXNwb3NlLmhlYWRlcnMsIHtjb2xvcnM6dHJ1ZX0pO1xuICAgIGNvbnNvbGUuZGlyKHJlc3Bvc2UuZGF0YSwge2NvbG9yczp0cnVlfSk7XG4gICAgLy8gaWYgcmVzcG9zZS5kYXRhIGlzIGEganNvbiBzdHJpbmcsIHJlc3Bvc2UuanNvbiB3aWxsIHJldHVybiB0aGUganNvbiBvYmplY3RcbiAgICBjb25zb2xlLmRpcihyZXNwb3NlLmpzb24sIHtjb2xvcnM6dHJ1ZX0pO1xufSk7XG5cbnJlcXVlc3QucG9zdCgnaHR0cHM6Ly9odHRwYmluLm9yZy9wb3N0P2E9YicpLnRoZW4oKHJlc3Bvc2UpID0+IHtcbiAgICBjb25zb2xlLmRpcihyZXNwb3NlLnN0YXR1c0NvZGUsIHtjb2xvcnM6dHJ1ZX0pO1xuICAgIGNvbnNvbGUuZGlyKHJlc3Bvc2UuaGVhZGVycywge2NvbG9yczp0cnVlfSk7XG4gICAgY29uc29sZS5kaXIocmVzcG9zZS5kYXRhLCB7Y29sb3JzOnRydWV9KTtcbiAgICAvLyBpZiByZXNwb3NlLmRhdGEgaXMgYSBqc29uIHN0cmluZywgcmVzcG9zZS5qc29uIHdpbGwgcmV0dXJuIHRoZSBqc29uIG9iamVjdFxuICAgIGNvbnNvbGUuZGlyKHJlc3Bvc2UuanNvbiwge2NvbG9yczp0cnVlfSk7XG59KTtcblxuKi9cblxuaW1wb3J0ICogYXMgdXJsIGZyb20gJ3VybCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVxdWVzdENvbmZpZyB7XG4gICAgZGF0YT86IGFueTtcbiAgICBoZWFkZXJzPzoge307XG4gICAgbWV0aG9kPzogc3RyaW5nO1xufTtcblxuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMuZGF0YSAtIHBvc3QgZGF0YSBlLmcuIGZvcm0gZGF0YSBvciBmaWxlc1xuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMuaGVhZGVycyAtIGh0dHAgaGVhZGVyc1xuICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMubWV0aG9kIC0gUE9TVCBHRVQgZXRjXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZW5kICh1cmxTdHJpbmc6IHN0cmluZywgb3B0aW9ucyA9IHt9KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24odXJsLnBhcnNlKHVybFN0cmluZyksIG9wdGlvbnMpO1xuXG4gICAgICAgIGxldCByZXF1ZXN0ID0gcmVxdWlyZShvcHRpb25zLnByb3RvY29sID09PSAnaHR0cDonID8gJ2h0dHAnIDogJ2h0dHBzJykucmVxdWVzdChvcHRpb25zLCAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIHJlc3BvbnNlLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgICAgICAgICBsZXQgZGF0YSA9ICcnO1xuICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2RhdGEnLCAoY2h1bmspID0+IGRhdGEgKz0gY2h1bmspO1xuICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogcmVzcG9uc2Uuc3RhdHVzQ29kZSxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogcmVzcG9uc2UuaGVhZGVycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZ2V0IGpzb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXF1ZXN0Lm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuZGF0YSkge1xuICAgICAgICAgICAgcmVxdWVzdC53cml0ZShvcHRpb25zLmRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdC5lbmQoKTtcbiAgICB9KTtcbn1cblxuUmVxdWVzdCA9IHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLmhlYWRlcnMgLSBodHRwIGhlYWRlcnNcbiAgICAgKi9cbiAgICAvLyBnZXQ6ICh1cmwsIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgICAgICAvLyBkZWxldGUgb3B0aW9ucy5kYXRhO1xuICAgICAgICAvLyByZXR1cm4gUmVxdWVzdC5zZW5kKHVybCwgb3B0aW9ucyk7XG4gICAgLy8gfSxcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMuZGF0YSAtIHBvc3QgZGF0YSBlLmcuIGZvcm0gZGF0YSBvciBmaWxlc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLmhlYWRlcnMgLSBodHRwIGhlYWRlcnNcbiAgICAgKi9cbiAgICAvLyBwb3N0OiAodXJsLCBvcHRpb25zID0ge30pID0+IHtcbiAgICAgICAgLy8gb3B0aW9ucy5kYXRhID0gcmVxdWlyZSgncXVlcnlzdHJpbmcnKS5zdHJpbmdpZnkob3B0aW9ucy5kYXRhIHx8IHt9KTtcbiAgICAgICAgLy8gb3B0aW9ucy5oZWFkZXJzID0gT2JqZWN0LmFzc2lnbihvcHRpb25zLmhlYWRlcnMgfHwge30sIHtcbiAgICAgICAgICAgIC8vICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcbiAgICAgICAgICAgIC8vICdDb250ZW50LUxlbmd0aCc6IEJ1ZmZlci5ieXRlTGVuZ3RoKG9wdGlvbnMuZGF0YSlcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIG9wdGlvbnMubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICAvLyByZXR1cm4gUmVxdWVzdC5zZW5kKHVybCwgb3B0aW9ucyk7XG4gICAgLy8gfVxufTtcbiJdfQ==
