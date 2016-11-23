import React, { Component } from 'react';
import { render }  from 'react-dom';
import Square from './Square'

const KEY = {
    UP:  38
};

class Game extends Component {
    constructor(props) {
        super(props); // see http://stackoverflow.com/questions/30668326/what-is-the-difference-between-using-constructor-vs-getinitialstate-in-react-r

        // set initial state todo: partition
        this.state = {
            context: null,
            maxWidth: 640,
            maxHeight: 480,
            gridSize: 50,
            mapData: [],
            keys: {
                up: false
            }
        };
    }

    componentDidMount() {
        // todo: needs work to handle keyup events
        window.addEventListener('keyup', this.handleKeys.bind(this, this.state.keys.up!= true));

        // add mapData that was received as props in constructor to the state
        let newState = Object.assign({}, this.state);
        newState['mapData'].push(this.props.mapData);
        this.setState(newState);

        // now that component is mounted the context of canvas element can be determined
        this.setState({ context: document.getElementById('canvas').getContext('2d') });

        // initialise the update() method that is used for all actions not initiated by the player
        requestAnimationFrame(() => {this.update()});
    }

    componentDidUpdate() {
        // triggered when state changes outside of update() method, for example, a keypress or timer event
        this.update();
    }

    handleKeys(value, e){
        let keys = this.state.keys; // copy state for mutation
        if(e.keyCode === KEY.UP) keys.up = value; // adjust state
        this.setState({keys : keys}); // mutate state
    }

    update() {
        // for enemy movement you would add this to the update method:
        // this.setState({ enemyX: 231 });
        // note that player movement is handled by key events, not update() !
        const context = this.state.context;
        this.clearCanvas();
        this.draw2DMap();
        requestAnimationFrame(() => { this.update() }); // keep calling update function
    }

    clearCanvas() {
        this.state.context.clearRect(0, 0, this.state.maxWidth, this.state.maxHeight);
    }

    draw2DMap() {
        const context = this.state.context;
        let xpos = 0;
        let ypos = 0;

        //todo: fix that [0]
            this.state.mapData[0].map((row) => {
                row.map((key) => {
                    // todo: extract to component.. somehow
                    let fillColour = (key == 1 ? "#666" : "#fff");
                    context.beginPath();
                    context.rect(xpos, ypos, this.state.gridSize, this.state.gridSize);
                    context.fillStyle = fillColour;
                    context.strokeStyle = "#000";
                    context.lineWidth = "0.1";
                    context.fill();
                    context.stroke();
                    xpos += this.state.gridSize;
                });
                ypos += this.state.gridSize;
                xpos = 0;
            })
   }

    render() {
        return (
            <canvas id="canvas"
                width={ this.state.maxWidth }
                height={ this.state.maxHeight }
            />
        )
    }

}

export default Game;
