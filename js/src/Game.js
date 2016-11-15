import React, { Component } from '../../node_modules/react/react';
import { render } from '../../node_modules/react-dom/index';
import ReactCanvas from '../../node_modules/react-canvas/lib/ReactCanvas';
var Surface = ReactCanvas.Surface;
var Image = ReactCanvas.Image;
var Text = ReactCanvas.Text;

class Game extends ReactCanvas.Component {

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

    render() {
        var surfaceWidth = window.innerWidth;
        var surfaceHeight = window.innerHeight;
        var imageStyle = this.getImageStyle();
        var textStyle = this.getTextStyle();
        return (
            <Surface width={surfaceWidth} height={surfaceHeight} left={0} top={0}>
                <Image style={imageStyle} src='...' />
                <Text style={textStyle}>
                    Here is some text below an image.
                </Text>
            </Surface>
        )
    }

    getImageStyle() {
        return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: this.getImageHeight()
        };
    }

    getImageHeight() {
        return Math.round(window.innerHeight / 2);
    }

    getTextStyle() {
        return {
            top: this.getImageHeight() + 10,
            left: 0,
            width: window.innerWidth,
            height: 20,
            lineHeight: 20,
            fontSize: 12
        };
    }

}

export default Game;
