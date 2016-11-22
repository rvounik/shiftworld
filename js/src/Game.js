import React, { Component } from 'react';
import { render }  from 'react-dom';

/*
const KEY = {
    LEFT:  37,
    RIGHT: 39
};
*/

class Game extends React.Component {

    constructor() {
        super(); // todo is this still good practice?
        this.state = {
            context: null
        };
        this.ypos=20;
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

        const context = this.refs.canvas.getContext('2d');
        this.setState({ context: context });
        requestAnimationFrame(() => {this.update()}); // on mount, call update function once
    }

    update() {
        let state = this.state;
        let ypos = this.ypos; // should come from state
        const context = state.context;

        context.clearRect(0, 0, 320, 240); // wipe canvas

        context.font = "48px serif";
        context.fillStyle= '#ffffff';
        context.fillText("Hello world", 10, 70 + (30 * Math.sin(ypos)) );
        context.fill();
        context.save(); // update canvas element todo what does this do and what does save do?

        this.ypos+=0.1; // state mutation from update method? not good.

        requestAnimationFrame(() => {this.update()}); // keep calling update function
    }

    render() {
        return (
            <canvas ref="canvas"
                width={ 320 }
                height={ 240 }
            />
        )
    }

}

export default Game;
