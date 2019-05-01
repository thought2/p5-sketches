import p5 = require("p5");
import * as _ from "lodash";

const url = (limit: number): string =>
  `https://commons.wikimedia.org/w/api.php?origin=*&action=query&format=json&prop=imageinfo&iiprop=url|size|sha1&generator=random&iiurlwidth=100&grnnamespace=6&grnlimit=${limit}`;

const mkImgUrl = (folder: string, fileName: string, width: number): string =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${folder}${fileName}/${width}px-${fileName}`;

const config = {
  countParticles: 10
};

new p5((p: p5) => {
  let particles: Array<Particle> = [];

  class Particle {
    pos: p5.Vector;
    img: p5.Image;
    size: p5.Vector;

    constructor(args: { img: p5.Image; size: p5.Vector }) {
      Object.assign(this, args, { pos: p.createVector(0, 0) });
      return this;
    }

    position() {
      this.pos = p.createVector(p.random(0, p.width), p.random(0, p.height));
      return this;
    }

    move(pos: p5.Vector) {
      this.pos = pos;
    }

    draw(p: p5) {
      p.image(this.img, this.pos.x, this.pos.y);
    }
  }

  const loadParticles = () => {
    const width = p.width / 10;

    particles = [];

    p.httpGet(url(100)).then(rawData => {
      const data = rawData as {
        query: {
          pages: {
            [key: string]: {
              imageinfo?: [{ url: string; width: number; height: number }];
            };
          };
        };
      };

      Object.keys(data.query.pages)
        .reduce(
          (memo, key) => {
            const imageInfo = data.query.pages[key].imageinfo;
            if (!imageInfo) return memo;

            const { width, height, url } = imageInfo[0];
            const result = url.match(
              /^https:\/\/upload.wikimedia.org\/wikipedia\/commons\/([0-9a-z]{1,2}\/[0-9a-z]{1,2}\/)(.*\.jpg)$/
            );
            if (!result) return memo;

            memo.push({
              maxSize: p.createVector(width, height),
              folder: result[1],
              fileName: result[2]
            });

            return memo;
          },
          [] as Array<{ maxSize: p5.Vector; folder: string; fileName: string }>
        )
        .filter(item => width <= item.maxSize.x)
        .forEach(({ folder, fileName, maxSize }) => {
          const url = mkImgUrl(folder, fileName, p.round(width));
          p.loadImage(url, img => {
            const aspect = maxSize.x / maxSize.y;
            const size = p.createVector(width, width / aspect);
            particles.push(new Particle({ img, size }).position());
          });
        });
    });
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);

    loadParticles();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    loadParticles();
  };

  p.draw = () => {
    p.background(200);
    particles.forEach(particle => {
      //if (!particle) return;
      particle.draw(p);
    });
  };
});
