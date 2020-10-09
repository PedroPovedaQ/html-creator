'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs'));
var mkdirp = _interopDefault(require('mkdirp'));
var lodash = _interopDefault(require('lodash'));

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var tools = createCommonjsModule(function (module) {
/**
 * Creates a file at the given destination
 * @param  {String} filePath
 * @param  {Any} 	content
 */
const writeFile = (filePath, content) => new Promise((resolve, reject) => {
	if (!filePath) {
		return reject('A file path is required');
	}
	return mkdirp(path.dirname(filePath), mkdirpErr => {
		if (!mkdirpErr) {
			return resolve(fs.writeFile(filePath, content, fsErr => reject(`Something went wrong when writing to the file: ${fsErr}`)));
		}
		return reject(`Something went wrong when creating the file: ${mkdirpErr}`);
	});
});

/**
* Logs a message of a given type in the terminal
* @param {String} type
* @param {String} msg
* @return {Object}
*/
const logMessage = (type, msg) => {
	const types = { default: '\x1b[37m%s\x1b[0m', success: '\x1b[32m%s\x1b[0m', error: '\x1b[31m%s\x1b[0m' };
	const logColor = (!types[type]) ? types.default : types[type];
	const logMsg = `HTML-Creator >> ${msg}`;
	console.log(logColor, logMsg); // eslint-disable-line no-console
	return { logColor, logMsg }; // Return for testing purposes
};

/**
 * Search a stack for an element matching the given needle
 * @param {Array} stack
 * @param {String} type
 * @param {String} id
 * @param {String} className
 */
const searchForElement = ({ stack, type, id, className }) => {
	const result = [];

	if (stack && stack.constructor === Array) {
		// Look for matches and push to the result
		result.push(stack.filter(element => {
			if (type) { return element.type === type; }
			if (id) { return element.attributes && element.attributes.id === id; }
			if (className) { return element.attributes && element.attributes.class === className; }
			return null;
		}));
		// Loop through the content of the element and look for matches
		stack.forEach(element => {
			if (element.content && element.content.constructor === Array) {
				const deepSearch = searchForElement({ stack: element.content, type, id, className });
				if (deepSearch) { result.push(deepSearch); }
			}
		});
	}
	// Flatten result array or just return a single object
	const flatResult = lodash.flattenDeep(result);
	if (flatResult.length > 0) {
		if (flatResult.length === 1) {
			return flatResult[0];
		}
		return flatResult;
	}
	return null;
};

const pushOrConcat = (targetArray, input) => {
	if (input.constructor === Array) {
		return targetArray.concat(input);
	}
	targetArray.push(input);
	return targetArray;
};

module.exports = {
	logMessage,
	writeFile,
	searchForElement,
	pushOrConcat,
};
});

var tools_1 = tools.logMessage;
var tools_2 = tools.writeFile;
var tools_3 = tools.searchForElement;
var tools_4 = tools.pushOrConcat;

var element = createCommonjsModule(function (module) {
/**
 * Returns a string with the props as HTML attributes
 * @param {Object} props
 */
const applyAttributes = (attributes) => {
	if (attributes && attributes.constructor === Object) {
		return Object.keys(attributes).map(key => ` ${key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`)}="${attributes[key]}"`).join('');
	}
	return '';
};

/**
 * Parses given content. If the content is an array, recursive parsing will be performed
 * @param {String/Array} content
 * @param {Function} createElementMethod
 */
const parseContent = (content, createElementMethod) => {
	if (content && content.constructor === Array) {
		return content.map(element => createElementMethod(element)).join('');
	}
	return content || '';
};

/**
 * Creates a HTML element from the given data
 * @param {String} type - The HTML Tag type
 * @param {Object} applyAttributes - The HTML attributes to be added to the tag
 * @param {String/Array} content - The content of the tag. Can be either a string or an array of elements
 */
const create = ({ type, attributes, content, customTagContent }) => {
		if (type) {
		return (content) ?
			`<${type}${applyAttributes(attributes)}${customTagContent}>${parseContent(content, create)}</${type}>` : `<${type}${applyAttributes(attributes)}${customTagContent}></${type}>`;
	}
	return content;
};

module.exports = {
	create,
	parseContent,
	applyAttributes,
};
});

var element_1 = element.create;
var element_2 = element.parseContent;
var element_3 = element.applyAttributes;

class Document {
	constructor(content) {
		if (content) {
			this.setContent(content);
		} else {
			this.setContent([]);
		}
	}

	/**
	 * Sets the content of the Document
	 * @param {Array} content
	 */
	setContent(content) {
		if (!content || content.constructor !== Array) {
			return tools.logMessage('error', 'The content needs to be provided as an Array');
		}
		this.content = content;
		return content;
	}

	/**
	 * Parses the content and returns the elements in HTML
	 */
	getContentInHTML() {
		let output = '';
		if (this.content && this.content.constructor === Array) {
			this.content.forEach(element$$1 => {
				output += element.create(element$$1);
			});
		}
		return output;
	}

	/**
	 * Returns the content in HTML as a string
	 */
	getHTML() {
		return `<!DOCTYPE html><html>${this.getContentInHTML()}</html>`;
	}

	/**
	 * Finds and returns an element by type.
	 * Returns null if not found.
	 * @param {String} needle
	 */
	findElementByType(needle) {
		return tools.searchForElement({ stack: this.content, type: needle });
	}
	/**
	 * Finds and returns an element by ID.
	 * Returns null if not found.
	 * @param {String} needle
	 */
	findElementById(needle) {
		return tools.searchForElement({ stack: this.content, id: needle });
	}
	/**
	 * Finds and returns an element by class.
	 * Returns null if not found.
	 * @param {String} needle
	 */
	findElementByClassName(needle) {
		return tools.searchForElement({ stack: this.content, className: needle });
	}

	/**
	 * Helper function to set the title of the document
	 * @param {String} newTitle
	 */
	setTitle(newTitle) {
		// Begin by searching for an existing title tag
		const titleTag = this.findElementByType('title');
		if (titleTag) {
			titleTag.content = newTitle;
			return newTitle;
		}
		// Next search for an existing head tag
		const headTag = this.findElementByType('head');
		if (headTag) {
			if (headTag.content && headTag.content.constructor === Array) {
				headTag.content.push({
					type: 'title',
					content: newTitle,
				});
			} else {
				headTag.content = [{
					type: 'title',
					content: newTitle,
				}];
			}
			return newTitle;
		}
		// If we passed to this point, we simply add a new head tag and a title tag
		this.content.push({
			type: 'head',
			content: [{
				type: 'title',
				content: newTitle,
			}],
		});
		return newTitle;
	}

	/**
	 * Helper function that sets a simple boilerplate content
	 * @param {Array} content
	 */
	withBoilerplate(content) {
		this.content = [
			{
				type: 'head',
				content: [
					{ type: 'meta', attributes: { charset: 'utf-8' } },
					{ type: 'meta', attributes: { name: 'viewport', content: 'width=device-width, initial-scale=1, shrink-to-fit=no' } },
				],
			},
			{ type: 'body', content },
		];
		return this;
	}

	/**
	 * Adds element data to the content. This method is chainable.
	 * @param {Object} elementData
	 */
	addElement(elementData) {
		this.content = tools.pushOrConcat(this.content, elementData);
		return this;
	}

	/**
	 * Adds element data to the specified target (id, class or type). This method is chainable.
	 * @param {Object} elementData
	 * @param {Object} targetData
	 */
	addElementToTarget(elementData, targetData) {
		let targetElement;

		// Look up the target element
		if (targetData && targetData.id) {
			targetElement = this.findElementById(targetData.id);
		} else if (targetData && targetData.class) {
			targetElement = this.findElementByClassName(targetData.class);
		} else if (targetData && targetData.type) {
			targetElement = this.findElementByType(targetData.type);
		}

		// Internal method for adding the element data to a given content
		const addContent = ({ targetContent, data }) => {
			let newContent = targetContent;
			if (targetContent && targetContent.constructor === Array) {
				newContent = tools.pushOrConcat(newContent, data);
			} else if (targetContent && targetContent.constructor === String) {
				const oldContent = targetElement.content;
				newContent = [];
				newContent.push({ content: oldContent });
				newContent = tools.pushOrConcat(newContent, data);
			} else {
				newContent = [];
				newContent = tools.pushOrConcat(newContent, data);
			}
			return newContent;
		};

		// Add the element to the target element
		if (targetElement && targetElement.constructor === Array) {
			// If we have found several matching target elements, we need to parse and add the data to each of them
			targetElement.map((el, i) => {
				targetElement[i].content = addContent({ targetContent: el.content, data: elementData });
				return true;
			});
		} else {
			// If one one match was found, simply add the data to its content
			targetElement.content = addContent({ targetContent: targetElement.content, data: elementData });
		}
		return this;
	}

	/**
	 * Adds element data to given class name
	 * @param {String} className
	 * @param {Object} elementData
	 */
	addElementToClass(className, elementData) {
		return this.addElementToTarget(elementData, { class: className });
	}

	/**
	 * Adds element data to given ID
	 * @param {String} className
	 * @param {Object} elementData
	 */
	addElementToId(id, elementData) {
		return this.addElementToTarget(elementData, { id });
	}

	/**
	 * Adds element data to given type
	 * @param {String} className
	 * @param {Object} elementData
	 */
	addElementToType(type, elementData) {
		return this.addElementToTarget(elementData, { type });
	}
}

var document = Document;

class HtmlCreator {
	constructor(content) {
		this.document = new document(content);
	}

	/**
	 * Helper function that sets a simple boilerplate content
	 * @param {Array} content
	 */
	withBoilerplate(content) {
		this.document.withBoilerplate(content);
		return this;
	}

	renderHTML(config) {
		if (config) {
			const { excludeHTMLtag } = config;
			if (excludeHTMLtag) {
				return this.document.getContentInHTML();
			}
		}
		return this.document.getHTML();
	}

	renderHTMLToFile(destination) {
		return tools.writeFile(destination, this.renderHTML())
			.then(() => tools.logMessage('success', `HTML generated (${destination})`))
			.catch(error => tools.logMessage('error', error));
	}
}

var src = HtmlCreator;

module.exports = src;
