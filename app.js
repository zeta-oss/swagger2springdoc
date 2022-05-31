hljs.initHighlightingOnLoad();

function swaggerToSpringBootAnnotation(path, method, swaggerBody) {
    const input = {};
    input["paths"] = {};
    input["paths"][path] = {};
    input["paths"][path][method] = JSON.parse(swaggerBody);

    let output = "";
    output += prettyHeader("Annotations");
    output += `@Operation(method = ${method.toUpperCase()},\n`;
    if (input["paths"][path][method]["tags"]) {
        output += `\ttags = "${undefinedReturnEmpty(
            input["paths"][path][method]["tags"][0]
        )}",\n`;
    }
    output += `\tsummary = "${undefinedReturnEmpty(
        input["paths"][path][method]["summary"]
    )}",\n`;
    output += `\tdescription = "${undefinedReturnEmpty(
        input["paths"][path][method]["description"]
    )}",\n`;
    output += `\toperationId = "${undefinedReturnEmpty(
        input["paths"][path][method]["operationId"]
    )}",\n`;
    if (input["paths"][path][method]["parameters"]) {
        output += `\tparameters = {\n`;
        input["paths"][path][method]["parameters"].forEach((eachParameter) => {
            output += `\t\t@Parameter(name = "${eachParameter["name"]}",`;
            if (eachParameter["in"]) {
                output += ` in = ParameterIn.PATH,`;
            }
            output += ` description = "${undefinedReturnEmpty(
                eachParameter["tdescription"]
            )}",`;
            output += ` required = ${eachParameter["required"]},`;
            output += ` example = "${eachParameter["example"]}"`;
            output += ")\n";
        });
        output += `\t}\n`;
    }
    if (input["paths"][path][method]["responses"]) {
        output += `\tresponses = {\n`;
        Object.keys(input["paths"][path][method]["responses"]).forEach(
            (eachResponseCode) => {
                output += `\t\t@ApiResponse(responseCode = "${eachResponseCode}",`;
                output += ` description = "${undefinedReturnEmpty(
                    input["paths"][path][method]["responses"][eachResponseCode][
                    "description"
                    ]
                )}",`;
                output += ` content = {\n`;
                if (
                    input["paths"][path][method]["responses"][eachResponseCode]["content"]
                ) {
                    Object.keys(
                        input["paths"][path][method]["responses"][eachResponseCode][
                        "content"
                        ]
                    ).forEach((eachContentType) => {
                        output += `\t\t\t@Content(mediaType = "${eachContentType}",\n`;
                        output += `\t\t\t// schema = @Schema(implementation = @io.swagger.v3.oas.annotations.media.Schema(implementation = <Java Schema Class Here>))\n`;
                        output += `\t\t\t// array = @ArraySchema(implementation = @io.swagger.v3.oas.annotations.media.Schema(implementation = <Java Schema Class Here>))\n`;
                        if (
                            input["paths"][path][method]["responses"][eachResponseCode][
                            "content"
                            ][eachContentType]["examples"]
                        ) {
                            output += `\t\t\texamples = {\n`;
                            Object.keys(
                                input["paths"][path][method]["responses"][eachResponseCode][
                                "content"
                                ][eachContentType]["examples"]
                            ).forEach((eachExample) => {
                                output += `\t\t\t\t@Example(name = "${eachExample}",\n`;
                                output += `\t\t\t\t\tsummary = "${undefinedReturnEmpty(
                                    input["paths"][path][method]["responses"][eachResponseCode][
                                    "content"
                                    ][eachContentType]["examples"][eachExample]["summary"]
                                )}",\n`;
                                output += `\t\t\t\t\tdescription = "${undefinedReturnEmpty(
                                    input["paths"][path][method]["responses"][eachResponseCode][
                                    "content"
                                    ][eachContentType]["examples"][eachExample]["description"]
                                )}",\n`;
                                output += `\t\t\t\t\tvalue = ${undefinedReturnEmpty(
                                    valueStringifier(
                                        5, // tab  depth in this case
                                        input["paths"][path][method]["responses"][eachResponseCode][
                                        "content"
                                        ][eachContentType]["examples"][eachExample]["value"]
                                    )
                                )}`;
                                output += "\n\t\t\t\t)\n";
                            });
                            output += `\t\t\t}`;
                        }
                    });
                }
                output += `\n\t\t}\n`;
            }
        );
        output += `\t}\n`;
    }

    return output;

    // for debug
    // return (
    //   output + "\n" + prettyHeader("Raw JSON") + JSON.stringify(input, null, 4)
    // );
}

async function generateAnnotations(textValue) {
    let inputSwagger;
    try {
        inputSwagger = jsyaml.load(textValue);
    } catch (e) {
        inputSwagger = JSON.parse(textValue);
    }
    const generatedAnnotations = [];

    Object.keys(inputSwagger.paths).forEach((eachPath) => {
        Object.keys(inputSwagger.paths[eachPath]).forEach((eachMethod) => {
            const body = inputSwagger.paths[eachPath][eachMethod];
            const annotationItem = {};
            annotationItem["path"] = eachPath;
            annotationItem["method"] = eachMethod;
            annotationItem["annotations"] =
                "\n" +
                swaggerToSpringBootAnnotation(
                    eachPath,
                    eachMethod,
                    JSON.stringify(body)
                );
            generatedAnnotations.push(annotationItem);
        });
    });

    return generatedAnnotations;
}

function prettyHeader(header) {
    let output = "";
    const line =
        "-------------------------------------------------------------------------------------------------------------------------------------------------";
    output += `${line}\n`;
    output += `${header}\n`;
    output += `${line}\n`;
    return output;
}

function undefinedReturnEmpty(value) {
    return value === undefined ? "" : value;
}

const textField = document.querySelector('#textField');
const container = document.querySelector('.tabs');

textField.addEventListener('input', function () {
    let generateAnnotationsData = generateAnnotations(this.value);
    generateAnnotationsData.then((data) => {
        container.innerHTML = `<h1 class="is-size-4 has-text-left is-family-code" style="margin-bottom: 8px;">Generated Annotations</h1>`
        data.forEach(function (pathMethod, index) {
            html = `<div class="tab">
                    <input type="checkbox" id="chck${index+1}">
                    <label class="tab-label" for="chck${index+1}"><span class="${pathMethod.method}-tag">${pathMethod.method}</span>${pathMethod.path}</label>
                    <div class="tab-content">
                    <pre>
                      <code class="java">
                        ${pathMethod.annotations}
                      </code>
                    </pre>
                    </div>
            </div>`
    
            container.insertAdjacentHTML('beforeend', html);
    
            document.querySelectorAll('pre code').forEach((el) => {
                hljs.highlightBlock(el);
            });
        })
    }).catch((err) => {
        if(this.value) {
            container.innerHTML = `<h1>${err}</h1>`
        } else {
            container.innerHTML = ''
        }
    })
})
