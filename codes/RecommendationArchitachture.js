/**
 * RECOMMENDATION ARCHITECTURE
 *
 * To provide a plugin architecture that could be with filterdata and logic at any time without changing the entire code
 *
 * @author Joseph Panuncillo
 * @Date   January 20, 2014
 */


/////////////////////////////////////////////////////////////////////////////////////////
//- - - - - - - - - - - - START OF DECLARATIONS AND UTILITIES - - - - - - - - - - - -  //
/////////////////////////////////////////////////////////////////////////////////////////

/**
 * Utility function for assigning variable keys to object attributes
 * @param  string key     Attribute key
 * @param  object value   Attribute value
 * @return object         generated object
 */
function objectMaker(key, value) {
    var jsonVariable = {};
    jsonVariable[key] = value
    return jsonVariable;
}
/**
 * internal messaging, to be able to turn messaging on/off and where to display w/o scouring the source code
 * @param  string message
 */
function logger(message){
    alert(message);
}

/** Object that provides methods for adding new filter data */
var FILTER_DATA = function() {
    this.filterDataCollection = [];
};
FILTER_DATA.prototype = {
    /**
     * add new filter data
     * @param  string key                   object ID
     * @param  function newFilterDataObject object that returns the new filter data
     */
    regFilterDataObject: function(key, newFilterDataObject) {
        this.filterDataCollection.push(objectMaker(key, newFilterDataObject));
    },
    getFilterData: function() {
        return this.filterDataCollection;
    }
};

/** Object that provides methods for adding new filter logic */
var RECOMMENDATION_SYSTEM = function() {
    this.recommendationLogicCollection = [];
    this.videoData = [];
    this.filterData = [];
};
RECOMMENDATION_SYSTEM.prototype = {
    /**
     * adds new recommendation/filter logic
     * @param  RECOMMENDATION_LOGIC instance that contains new recommendation/filter
     */
    regRecommendationLogic: function(newRecommendationLogic) {
        this.recommendationLogicCollection.push(newRecommendationLogic);
    },
    /**
     * provide video data and filter data needed by the recommendation/filter execution
     * @param object[] filterData  list of video data/meta
     * @param object[] videoData    map of distinct filter data
     */
    setParameters: function(videoData, filterData) {
        this.videoData = videoData["videoData"];
        this.filterData = filterData["filterData"];
    },
    /**
     * Calls all recommendation/filter objects, executes each and the output replaces video data every iteration
     * @return final video data
     */
    execute: function() {
        var videoData = this.videoData;
        var filterData = this.filterData;
        logger("original = " + JSON.stringify(videoData))

        async.forEach(this.recommendationLogicCollection, function(obj, callback){
            logger(obj.executeMessage);
            videoData = obj.filter(filterData, videoData)
            logger("output = " + JSON.stringify(videoData))
        }, function(err) {
            logger("final = " + JSON.stringify(videoData))
        });

        return videoData;
    }
};

/**
 * Object that wraps new filter logics to make it usable by the system
 * @param string executeMessage Message display when filter logic is executed
 */
var RECOMMENDATION_LOGIC = function(executeMessage) {
    this.executeMessage = executeMessage;
}
RECOMMENDATION_LOGIC.prototype = {
    /**
     * function to be overridden to contain new recommendation/filter logic
     * @param object[] filterData  list of video data/meta
     * @param object[] videoData   map of distinct filter data
     * @return object[] ist of video data/meta
     */
    filter: function(filterData, videoData) {
        return videoData;
    }
}

var filterData = new FILTER_DATA();
var recommendationSystem = new RECOMMENDATION_SYSTEM();

////////////////////////////////////////////////////////////////////////////////////////
//- - - - - - - - - - - - END OF DECLARATIONS AND UTILITIES - - - - - - - - - - - -   //
////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////
//- - - - - - - - - - - - START OF ARCHITECTURE USAGE SAMPLES - - - - - - - - - - - -   //
//////////////////////////////////////////////////////////////////////////////////////////

/**
 * sampleFilterData1 and sampleFilterData2 returns filter/recommendation data in form of an object array
 * this is used as entry point of data to the system from any source
 * 
 * @return object[] data that could be understood by the recommendation/filter logic
 */
function sampleFilterData1() {
    return ["1data1", "2data1", "3data1"];
}
function sampleFilterData2() {
    return ["1data2", "2data2", "3data2"];
}

/**
 * instantiating RECOMMENDATION_LOGIC and assigning an execution message
 * @type RECOMMENDATION_LOGIC
 */
var sampleFilterLogic1 = new RECOMMENDATION_LOGIC("executing filter1");
/**
 * overriding the RECOMMENDATION_LOGIC.filter(filterData, videoData) function to add new filter logic
 * @param  string key     Attribute key
 * @param  object value   Attribute value
 * @return object         generated object
 */
sampleFilterLogic1.filter = function(filterData, videoData) {
    var index = videoData.indexOf("vid2");
    if (index)
        videoData.splice(index, 1);
    return videoData;
};

/**
 * adding new filter data, the first parameter is the key to map to that filter data
 */
filterData.regFilterDataObject("first", sampleFilterData1());
filterData.regFilterDataObject("second", sampleFilterData2());
/**
 * adding new filter logic
 */
recommendationSystem.regRecommendationLogic(sampleFilterLogic1)

///////////////////////////////////////////////////////////////////////////////////////////
//- - - - - - - - - - - - END OF ARCHITECTURE USAGE SAMPLES - - - - - - - - - - - -    //
///////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////
//- - - - - - - - - - - - START OF ARCHITECTURE OPERATIONS - - - - - - - - - - - -  //
//////////////////////////////////////////////////////////////////////////////////////

/**
 * function to be overriden to add the approriate video data
 * @param  object seriesCallback mandatory async.series parameter
 */
function videoInfo(seriesCallback) {
    seriesCallback(null, {
        videoData: ["vid1", "vid2", "vid3"]
    });
}

/**
 * to facilitate fetching of both video data and filter data
 * @param  object waterFallCallback mandatory async.waterfall parameter
 */
function fetchInputs(waterFallCallback) {
    /**
     * Since there is a big possibility that data are fetched asynchronously, functions for fetching data are wrapped in async.series
     */
    async.series([
            /**
             * fetching video data/info
             */
            function(seriesCallback) {
                videoInfo(seriesCallback)
            },
            /**
             * fetching filter data
             */
            function(seriesCallback) {
                seriesCallback(null, {
                    filterData: filterData.getFilterData()
                });
            }
        ],
        /**
         * video data and filter data are combined into one array - results
         */
        function(err, results) {
            waterFallCallback(null, results);
        });
}

/**
 * performs actual filtering of video data
 * @param  object[] filter data and video data
 * @param  object waterFallCallback mandatory async.waterfall parameter
 */
function recommedationSystem(inputData, waterFallCallback) {
    recommendationSystem.setParameters(inputData[0], inputData[1])
    waterFallCallback(null, recommendationSystem.execute());
}

/**
 * since there is a big possibility that data accural and filter operations might be asychronous, function are wrapped in async.waterfall
 */
async.waterfall([
    /**
     * performs data accural
     * @param  object waterFallCallback mandatory async.waterfall parameter
     */
    function(waterFallCallback) {
        fetchInputs(waterFallCallback)
    },
    /**
     * performs filtering
     * @param  object[] inputData results from data accural
     * @param  object waterFallCallback mandatory async.waterfall parameter
     */
    function(inputData, waterFallCallback) {
        recommedationSystem(inputData, waterFallCallback)
    }
], function(err, result) {
    /**
     * Contains final filtered output, will be modified when applied to the actual resource app to output the video data directly
     */
    $("#data").html(JSON.stringify(result));
});

//////////////////////////////////////////////////////////////////////////////////////
//- - - - - - - - - - - - END OF ARCHITECTURE OPERATIONS - - - - - - - - - - - -  //
//////////////////////////////////////////////////////////////////////////////////////
