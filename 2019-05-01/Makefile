export PATH := $(shell pwd)/node_modules/.bin:$(PATH)

clean:
	rm -rf dist

build: clean
	parcel build --public-url "." src/index.html

dev:
	parcel src/index.html
