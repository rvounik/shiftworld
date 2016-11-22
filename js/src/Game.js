import React, { Component } from 'react';
import { render }  from 'react-dom';

/*
const KEY = {
    LEFT:  37,
    RIGHT: 39
};
*/

class Game extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            context: null,
            maxWidth: 640,
            maxHeight: 480
        };

        this.ypos = 20;
    }

    /*
    render() {
        let something = 'test';
        const map = {
            [1,1,1,1,1,1,1],
            [1,0,0,0,0,0,1],
            [1,0,0,0,0,0,1],
            [1,0,0,0,0,0,1],
            [1,0,0,0,0,1,1],
            [1,0,0,0,1,1,1],
            [1,1,0,1,1,1,1],
            [1,1,0,1,1,1,1],
            [1,1,1,1,1,1,1]
        };

        for (var key in map) {
            return (
                <div>{ map[key] }</div>

            )
        }
    }
    */

    componentDidMount() {
        //window.addEventListener('keyup',   this.handleKeys.bind(this, false));
       // window.addEventListener('keydown', this.handleKeys.bind(this, true));
        //window.addEventListener('resize',  this.handleResize.bind(this, false));

        const context = document.getElementById('canvas').getContext('2d');
        this.setState({ context: context });
        requestAnimationFrame(() => {this.update()}); // on mount, call update function once
    }

    update() {
        const context = this.state.context;
        let ypos = this.ypos;

        this.clearCanvas(); // so.. how do we persist content in the canvas element? next step.

        context.font = "48px serif";
        context.fillStyle= '#ffffff';
        context.fillText("Hello world", 10, 70 + (30 * Math.sin(ypos)) );
        context.fill();
        context.save(); // update canvas element todo what does this do and what does save do?

        this.ypos += .1; // state mutation from update method? not good.

        requestAnimationFrame(() => { this.update() }); // keep calling update function
    }

    clearCanvas() {
        this.state.context.clearRect(0, 0, this.state.maxWidth, this.state.maxHeight);
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
