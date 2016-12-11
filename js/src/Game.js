import React, { Component } from 'react';
import { render }  from 'react-dom';
import update from 'immutability-helper';
import Grid from './MiniMap/Grid'

// constants
const KEY = {
    UP:  38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39
}, PI = 3.14159265359;

class Game extends Component {
    constructor(props) {
        super(props);

        // global state
        this.state = {
            context: null,
            mapData: [],
            keys: {
                up: false,
                down: false,
                left: false,
                right: false
            },
            engine: {
                fps: 25,
                maxWidth: 640,
                maxHeight: 480,
                projectionWidth: 160,
                fieldOfVision: 80,
                rotationSpeed: 3,
                lineLength: 50,
                playerSpeed: 1
            },
            grid: {
                gridSize: 10,
                gridOffsetX: 0,
                gridOffsetY: 0
            },
            player: {
                playerXpos: 52,
                playerYpos: 82,
                playerRotation: 95.1
            },
            gameStates: {
                initialised: false,
                title: false,
                start: false,
                map: false,
                end: false
            }
        };

        // local state (do not put these in the state!)
        this.bounds = {};

        // debugger
        this.debug = true;

        // fps
        this.timer = new Date().getTime();
        this.frameCount = 0;
        this.fpsTimer = 0; // this is independent from the update() timer
    }

    componentDidMount() {
        // add mapData that was received as props in constructor to the state
        let newState = Object.assign({}, this.state);
        newState['mapData'].push(this.props.mapData);
        this.setState(newState);

        // now that component is mounted the context of canvas element can be determined
        this.setState({ context: document.getElementById('canvas').getContext('2d') });
    }

    componentDidUpdate() {
        // hide title screen if game has started
        if(this.state.gameStates.title && this.state.gameStates.start) {
            this.updateGameState('title', false);
            this.drawMiniMap();
        }

        // initialise game if not already done so
        if (this.state.context != null && this.state.gameStates.initialised != true) {
            // register key event listeners
            window.addEventListener('keyup', this.handleKeys.bind(this, false));
            window.addEventListener('keydown', this.handleKeys.bind(this, true));

            // register reusable global window event listener for click events
            window.addEventListener('click', (event) => {this.clickWithinBoundsHandler(event)});

            // to complete initialised, set its gameState to true
            this.updateGameState('initialised', true);

            // draw title screen
            this.drawTitleScreen();
        }

        this.update(); // triggered when state changes outside of update() method
    }

    // todo: move helper methods to helper component

    // helper function that clears the canvas
    clearCanvas() {
        const context= this.state.context;
        context.fillStyle = "#000";
        context.fillRect( 0, 0, this.state.engine.maxWidth, this.state.engine.maxHeight );
        // alternative: this.state.context.clearRect(0, 0, this.state.engine.maxWidth, this.state.engine.maxHeight);
    }

    // helper function to iterate over object and return them as key,value pairs
    mapObject(object, callback) {
        return Object.keys(object).map(function (key) {
            return callback(key, object[key]);
        });
    }

    // helper function to update a key, value pair inside state.gameStates
    updateGameState(key, value) {
        let newState = update(this.state, {
            gameStates: {
                [key]: { $set: value }
            }
        });

        this.setState(newState);

        if (this.debug){console.log('changed gameState for '+key+' to '+value)}
    }

    // helper function that checks whether user clicked within an active boundary range
    clickWithinBoundsHandler(event){
        // todo: take scrolltop into account
        if (
            event.clientX >= this.bounds.xMin
            && event.clientX <= this.bounds.xMax
            && event.clientY >= this.bounds.yMin
            && event.clientY <= this.bounds.yMax
        ) {
            // executes the action that was registered for these boundaries, then resets them
            this.bounds.action();
            this.bounds = {};
        }
    }

    // helper function that returns new x, y for given x, y, rotation and length
    getTranslationPointsForAngle(x, y, a, length) {
        let radians = a * (PI / 180);
        let x2 = x + length * Math.cos(radians);
        let y2 = y + length * Math.sin(radians);
        return [x2, y2];
    }

    // update state according to keys being (sup)pressed
    handleKeys(value, e){
        let keys = this.state.keys; // copy state
        if(e.keyCode === KEY.UP) keys.up = value; // mutate state
        if(e.keyCode === KEY.DOWN) keys.down = value;
        if(e.keyCode === KEY.LEFT) keys.left = value;
        if(e.keyCode === KEY.RIGHT) keys.right = value;
        this.setState({keys : keys}); // set state (this will trigger the update() method so screen is re-rendered)

        e.preventDefault();
    }

    // calculates line length between 2 points
    getLineLengthBetweenPoints (x, y, x0, y0){
        return Math.sqrt((x -= x0) * x + (y -= y0) * y);
    };

    drawTitleScreen() {
        // todo: move to component
        let imageObj = new Image();
        let context = this.state.context;

        imageObj.onload = function() {
            //make sure image has loaded before rendering button to prevent image appearing after game started
            context.drawImage(imageObj, 0, 50);

            // draw start button
            const buttonX = 250;
            const buttonY = 300;
            context.beginPath();
            context.fillStyle = 'limegreen';
            context.fillRect(buttonX, buttonY, 120, 50);
            context.font = '12px arial';
            context.fillStyle= 'white';
            context.fillText("START GAME", buttonX + 20, buttonY + 30);
            context.fill();

            this.updateGameState('title', true);

            // register button boundaries and click action
            this.bounds = {
                xMin: 250,
                xMax: 370,
                yMin: 300,
                yMax: 350,
                action: function() {
                    this.updateGameState('start', true)
                }.bind(this)
            };

        }.bind(this);

        imageObj.src = 'assets/image/title-shiftworld.jpg';
    }

    drawMiniMap() {
        this.clearCanvas();

        if(! this.grid){
            this.grid = new Grid({
                grid: this.state.grid,
                context: this.state.context,
                mapData: this.state.mapData
            });
        }

        // actually render the instantiated grid object
        this.grid.render();

        // build 2d projection for minimap todo: move to component
        const context = this.state.context;

        let rot = this.state.player.playerRotation;
        let x = this.state.player.playerXpos + this.state.grid.gridOffsetX;
        let y = this.state.player.playerYpos + this.state.grid.gridOffsetY;
        let newX = this.getTranslationPointsForAngle(x, y, rot, this.state.engine.lineLength)[0];
        let newY = this.getTranslationPointsForAngle(x, y, rot, this.state.engine.lineLength)[1];

        // we need to draw the line somewhere (pun intended)
        context.beginPath();
        context.strokeStyle = 'red';
        context.lineWidth = '1';
        context.moveTo(x, y);
        context.lineTo(newX, newY);
        context.stroke();

        // build visible rays for minimap
        const rotStart = rot - this.state.engine.fieldOfVision / 2;
        const rotSlice = this.state.engine.fieldOfVision / this.state.engine.projectionWidth;

        // todo: turn into while
        for(let i = 0; i < this.state.engine.projectionWidth; i ++){
            let x = this.state.player.playerXpos + this.state.grid.gridOffsetX;
            let y = this.state.player.playerYpos + this.state.grid.gridOffsetY;
            let newX = this.getTranslationPointsForAngle(x, y, rotStart + rotSlice * i, this.state.engine.lineLength)[0];
            let newY = this.getTranslationPointsForAngle(x, y, rotStart + rotSlice * i, this.state.engine.lineLength)[1];

            context.beginPath();
            context.strokeStyle = 'rgba(255, 0, 0, 0.1)';
            context.lineWidth = '1';
            context.moveTo(x, y);
            context.lineTo(newX, newY);
            context.stroke();
        }

        this.drawProjection();
    }

    /*withinMapBounds(newx, newy) {
        const map = this.state.mapData[0];
        const gridSize = this.state.grid.gridSize;
        let mapWidth = map[0].length * gridSize; // 10
        let mapHeight = map.length * gridSize; // 25

        // calculate the lookup position for mapData
        let newtilex = parseInt(newx / gridSize);
        let newtiley = parseInt(newy / gridSize);

        // first check if newx, newy are out of range of the map by pixels
        if (newx > mapWidth || newx < 0) {return false}
        if (newy > mapHeight || newy < 0) {return false}

        // then check if the calculated lookup index for the array is within its bounds
        if (
               newtiley > map[0].length
            || newtiley < 0
            || newtilex > map.length
            || newtilex < 0
            || isNaN(newtilex)
            || isNaN(newtiley)
        ) {
            return false;
        }

        // last check if there is a wall in the way
        if (map[newtiley][newtilex] != 0) {
            return false;
        }

        return true;
    }*/

    getLineLengthForAngle(angle) {

        // set some constants
        const context = this.state.context;
        const x = this.state.player.playerXpos;
        const y = this.state.player.playerYpos;
        const gridSize = this.state.grid.gridSize;
        const map = this.state.mapData[0];
        const radiansConversion = PI / 180;
        const mapWidth = map[0].length;
        const mapHeight = map.length;
        const mapWidthInPixels = gridSize * mapWidth;
        const mapHeightInPixels = gridSize * mapHeight;

        // set some variables
        let xShift, yShift, tempLengthY, tempLengthX;
        let newx = x;
        let newy = y;

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

        let lineLengthForXAxis = 0;

        // set initial map indices
        let tileX = parseInt(x / gridSize);
        let tileY = parseInt(y / gridSize);

        let tempx = x;
        let tempy = y;

        // xshift calculation
        while(tileX > 0 && tileY >= 0 && tileX < map[0].length && tileY < map.length){

            if(map[tileY][tileX] != '1'){

                if (angle > 0 && angle <= 90) {
                    newx > gridSize ? xShift = gridSize - (newx % gridSize) : xShift = gridSize - newx; // going right
                    if (xShift == 0) { xShift = gridSize }
                    newy = tempy + (xShift * (Math.tan(angle * radiansConversion))); // going down
                    newx = tempx + xShift; // going right
                }
                if (angle > 90 && angle <= 180) {
                    newx < gridSize ? xShift = newx : xShift = (newx % gridSize); // going left
                    if (xShift == 0) { xShift = gridSize }
                    newy = tempy + (xShift / (Math.tan((angle + 270) * radiansConversion))); // going down
                    newx = tempx - xShift; // going left
                }
                if (angle > 180 && angle <= 270) {
                    newx < gridSize ? xShift = newx : xShift = (newx % gridSize); // going left
                    if (xShift == 0) { xShift = gridSize }
                    newy = tempy - (xShift * (Math.tan((angle + 180) * radiansConversion))); // going up
                    newx = tempx - xShift; // going left
                }
                if (angle > 270 && angle < 360) {
                    newx > gridSize ? xShift = gridSize - (newx % gridSize) : xShift = gridSize - newx; // going right
                    if (xShift == 0) { xShift = gridSize }
                    newy = tempy - (xShift / (Math.tan((angle + 90) * radiansConversion))); // going up
                    newx = tempx + xShift; // going right
                }

                // correct if out of bounds
                let shouldBreak = false;
                if(newx > mapWidthInPixels ){ newx=mapWidthInPixels; shouldBreak = true }
                if(newx < 0 ){ newx = 0; shouldBreak = true }
                if(newy > mapHeightInPixels ){ newy=mapHeightInPixels; shouldBreak = true }
                if(newy < 0 ){ newy = 0; shouldBreak = true }

                lineLengthForXAxis = this.getLineLengthBetweenPoints(x, y, newx, newy);

                if(shouldBreak){break}

                // set new map indices
                tileX = parseInt(newx / gridSize);
                tileY = parseInt(newy / gridSize);

                tempx = newx;
                tempy = newy;

            } else {
                // wall
                break;
            }

        }

        // draw the last dot
        /* context.beginPath();
        context.rect((newx + this.state.grid.gridOffsetX)-2, (newy + this.state.grid.gridOffsetY)-2, 4, 4);
        context.fillStyle = 'green';
        context.fill();*/

// YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY

        let lineLengthForYAxis = 0;

        // set initial map indices
        tileX = parseInt(x / gridSize);
        tileY = parseInt(y / gridSize);

        tempx = x;
        tempy = y;

        // yshift calculation
        while(tileX > 0 && tileY >= 0 && tileX < map[0].length && tileY < map.length){

            if(map[tileY][tileX] != '1'){

                if (angle > 0 && angle <= 90) {
                    newy > gridSize ? yShift = gridSize - (newy % gridSize) : yShift = gridSize - newy; // going right
                    if (yShift == 0) { yShift = gridSize }
                    newx = tempx + (yShift / (Math.tan(angle * radiansConversion))); // going down
                    newy = tempy + yShift; // going right
                }
                if (angle > 90 && angle <= 180) {
                    newy < gridSize ? yShift = newy : yShift = (newy % gridSize); // going left
                    if (yShift == 0) { yShift = gridSize }
                    newx = tempx - (yShift * (Math.tan((angle + 270) * radiansConversion))); // going down
                    newy = tempy + yShift; // going left
                }
                if (angle > 180 && angle <= 270) {
                    newy < gridSize ? yShift = newy : yShift = (newy % gridSize); // going left
                    if (yShift == 0) { yShift = gridSize }
                    newx = tempx - (yShift / (Math.tan((angle + 180) * radiansConversion))); // going up
                    newy = tempy - yShift; // going left
                }
                if (angle > 270 && angle < 360) {
                    newy > gridSize ? yShift = gridSize - (newy % gridSize) : yShift = gridSize - newy; // going right
                    if (yShift == 0) { yShift = gridSize }
                    newx = tempx + (yShift * (Math.tan((angle + 90) * radiansConversion))); // going up
                    newy = tempy - yShift; // going right
                }

                // correct if out of bounds
                let shouldBreak = false;
                if(newx > mapWidthInPixels ){ newx=mapWidthInPixels; shouldBreak = true }
                if(newx < 0 ){ newx = 0; shouldBreak = true }
                if(newy > mapHeightInPixels ){ newy=mapHeightInPixels; shouldBreak = true }
                if(newy < 0 ){ newy = 0; shouldBreak = true }

                lineLengthForYAxis = this.getLineLengthBetweenPoints(x, y, newx, newy);

                if(shouldBreak){break}

                // set new map indices
                tileX = parseInt(newx / gridSize);
                tileY = parseInt(newy / gridSize);

                tempx = newx;
                tempy = newy;

            } else {
                // wall
                break;
            }

        }

        // draw the last dot
        /*
        context.beginPath();
        context.rect((newx + this.state.grid.gridOffsetX)-2, (newy + this.state.grid.gridOffsetY)-2, 4, 4);
        context.fillStyle = 'red';
        context.fill();*/

        // calculate the definitive shortest route to nearest wall
        let shortestRoute = lineLengthForXAxis <= lineLengthForYAxis ? lineLengthForXAxis : lineLengthForYAxis;
        //console.log('hitting a wall at '+shortestRoute+' pixels');

        // return shortest length
        return shortestRoute;
    }

    drawProjection() {
        const context = this.state.context;
        //const debugProjection = false;
        //const resolution = this.state.engine.maxWidth / this.state.engine.projectionWidth;
        //const projectionDistance = (this.state.engine.projectionWidth / 5) / Math.tan((fov / 2) * (PI / 180));
        // let debugLineArray = [];

        for(let i = 0; i < this.state.engine.projectionWidth; i ++) {
            // re-determine angle for current 'ray' and check if valid
            let angle = (this.state.player.playerRotation) - (this.state.engine.fieldOfVision / 2); // starting angle for projection
            if (angle < 0) { angle += 360 } // correction if negative value
            angle += i * (this.state.engine.fieldOfVision / this.state.engine.projectionWidth); // this is the ray' rotation, not the player'

            let shortestRoute = this.getLineLengthForAngle(angle);

// DRAW WALL SECTION WITH ITS HEIGHT RELATED TO ITS DISTANCE

            // draw the wall section
            context.beginPath();
            context.rect(
                i * (this.state.engine.projectionWidth / this.state.engine.fieldOfVision),
                shortestRoute / 2,
                (this.state.engine.projectionWidth / this.state.engine.fieldOfVision),
                255 - shortestRoute
            );
            // let colorval = parseInt(Math.pow(sliceHeight, 2) / 255); // the closer, the brighter
            let colorval = 255;
            context.fillStyle = 'rgba(0, '+colorval+', 0, 1)';
            context.fill();

            // to prevent crashes immediately set i to the end value for now
            //i = this.state.engine.projectionWidth;
        }
    }

    update() {
        // huge performance gain: restrict the number of checks per second
        this.frameCount ++;
        if(this.timer + (1000 / this.state.engine.fps) < new Date().getTime()) {
            this.fpsTimer ++;
            if(this.debug && this.fpsTimer>this.state.engine.fps) {
                //console.log(this.frameCount / this.state.engine.fps);
                this.fpsTimer = 0;
                this.frameCount = 0;
            }

            // do all run-time operations and checks
            if(!this.state.gameStates.title && this.state.gameStates.start) {
                let playerXpos = this.state.player.playerXpos;
                let playerYpos = this.state.player.playerYpos;
                let playerRotation = this.state.player.playerRotation;
                let playerSpeed = this.state.engine.playerSpeed;

                // lets just assume we always need to render something
                if(this.state.keys.left) {
                    this.state.player.playerRotation -= this.state.engine.rotationSpeed;
                    if(this.state.player.playerRotation < 0){this.state.player.playerRotation += 360}
                    this.drawMiniMap(); // redraw map. performance penalty. remove when projection finished
                    this.drawProjection(); // redraw projection
                }
                if(this.state.keys.right) {
                    this.state.player.playerRotation += this.state.engine.rotationSpeed;
                    if(this.state.player.playerRotation >= 360){this.state.player.playerRotation -= 360}
                    this.drawMiniMap();
                    this.drawProjection();
                }
                if(this.state.keys.down) {
                    this.state.player.playerXpos = this.getTranslationPointsForAngle(playerXpos, playerYpos, playerRotation, 0 - playerSpeed)[0];
                    this.state.player.playerYpos = this.getTranslationPointsForAngle(playerXpos, playerYpos, playerRotation, 0 - playerSpeed)[1];
                    this.drawMiniMap();
                    this.drawProjection();
                }
                if(this.state.keys.up) {
                    this.state.player.playerXpos = this.getTranslationPointsForAngle(playerXpos, playerYpos, playerRotation, playerSpeed)[0];
                    this.state.player.playerYpos = this.getTranslationPointsForAngle(playerXpos, playerYpos, playerRotation, playerSpeed)[1];
                    this.drawMiniMap();
                    this.drawProjection();
                }

                // checkifenemiesneedtomove(); // call to some method that does things with enemy movement
            }

            this.timer = new Date().getTime();
        }

        // keep alive
        requestAnimationFrame(() => {this.update()});
    }

    render() {
        return (
            <canvas id = 'canvas'
                    width = {this.state.engine.maxWidth}
                    height = {this.state.engine.maxHeight}
            >Oh no! Canvas is not supported on your device :(</canvas>
        )
    }
}

export default Game;
