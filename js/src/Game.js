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
            maxHeight: 480,
            map: [
                [1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 1, 1],
                [1, 0, 0, 0, 1, 1, 1],
                [1, 1, 0, 1, 1, 1, 1],
                [1, 1, 0, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1]
            ]
        };

        this.ypos = 20;
    }

    componentDidMount() {
        // window.addEventListener('keyup',   this.handleKeys.bind(this, false));
        // window.addEventListener('keydown', this.handleKeys.bind(this, true));
        // window.addEventListener('resize',  this.handleResize.bind(this, false));

        this.setState({ context: document.getElementById('canvas').getContext('2d') });
        requestAnimationFrame(() => {this.update()}); // on mount, call update function once
    }

    update() {
        const context = this.state.context;

        this.clearCanvas(); // so.. how do we persist content in the canvas element? next step.

        this.draw2DMap();

        context.font = "48px serif";
        context.fillStyle= '#ffffff';
        context.fillText("Hello world", 10, 70 + (30 * Math.sin(this.ypos)) );
        context.fill();
        context.save(); // update canvas element todo what does this do and what does save do?

        this.ypos += .1; // state mutation from update method? not good.

        requestAnimationFrame(() => { this.update() }); // keep calling update function
    }

    clearCanvas() {
        this.state.context.clearRect(0, 0, this.state.maxWidth, this.state.maxHeight);
    }

    draw2DMap() {
        const context = this.state.context;
        let xpos = 0;
        let ypos = 0;

        for (let key in this.state.map) {
            console.log('iterating');
            let fillColour=(key == 1 ? "#000" : "#fff");
            context.beginPath();
            context.rect(xpos, ypos, 10, 10);
            context.fillStyle = fillColour;
            context.fill();
            xpos += 10;
        }
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
