const {
	app,
	BrowserWindow,
	Menu
} = require('electron')
const path = require('path')
const url = require('url')
const request = require('request')
const storage = require('electron-json-storage')
const fs = require('fs')
const ini = require('ini')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win, flashName, shockwaveName, winLoading

// Select desired PepperFlash for correct Platform
switch (process.platform) {
	case 'win32':
		flashName = 'PepperFlashPlayer.dll'
		break
	case 'darwin':
		flashName = 'PepperFlashPlayer.plugin'
		break
	case 'linux':
		flashName = 'libpepflashplayer.so'
		break
}

// Log Something
function novaLog(content) {
	console.log("[NovaApp] " + content)
}

// Log Something from Language Variables
function novaLangLog(langVariable) {
	novaLog(getLang("logs", langVariable))
}

function novaLangLogArgs(langVariable, logArgs) {
	novaLog(getLang("logs", langVariable) + logArgs)
}

// Load Pepper Flash (PPAPI)
app.commandLine.appendSwitch('ppapi-flash-path', path.join('assets/plugins/', flashName))

// Nova it's preparing his classes
novaLangLog("Preparing Modules...")

// Nova Class
function NovaApp() {

	// NovaApp Version
	const HabVersion = '012'

	// Language File
	const Language = 'english'

	// Last Server Updates
	var lastUpdatesHTML = ''

	// Server Data
	var serverData, localServerList, systemLanguages

	// NovaApp Variables
	var variables = {
		ServerProtocol: "http://",
		ServerToken: "",
		ServerUri: "",
		ServerBase: "/client.php",
	}

	var errorVars = {
		Title: "Error!",
		Message: "System got Error..."
	}

	// NovaApp Controllers
	var controllers = {
		Hotel: "?Page=Hotel",
		Users: "?Page=User",
		Engine: "?Page=Engine"
	}

	// NovaApp Modules
	var modules = {
		Token: "&Token=",
		Client: "&SubPage=ShowClient",
		HotelSettings: "&SubPage=Client",
		UserAuth: "&SubPage=Login",
		HotelStatus: "&SubPage=Status",
		UserCount: "&SubPage=OnlineCount",
		VersionCheck: "&SubPage=VersionCheck"
	}

	// Initialize NovaApp and store it contents
	this.initHab = function(needAddServer) {
		novaLangLog("prepareLaunch")
		novaLangLogArgs("selectedServer", global.NovaApp.getVar('ServerUri'))
		novaLangLogArgs("selectedToken", global.NovaApp.getVar('ServerToken'))

		// Retrieve Server Data
		if (needAddServer == true) {
			global.NovaApp.Requests().retrieveServer(function(response) {
				if (response == true) {
					novaLangLog("gatheredServer")

					global.NovaApp.Server().addServer(global.NovaApp.getData('base'))

					global.NovaApp.startComm();
				} else {
					novaLangLog("failedRetrieveServer")
				}
			});
		} else {
			global.NovaApp.startComm();
		}
	}

	// Start NovaApp Communication
	this.startComm = function() {
		global.NovaApp.Requests().validateAuth(function(response) {
			if (response == true) {
				// Load Hotel Client from NovaEngine
				win.loadURL(global.NovaApp.getBase() + global.NovaApp.getController('Hotel') + global.NovaApp.getModule('Client') + global.NovaApp.getToken())

				novaLangLog("loadClient")
			} else {
				global.NovaApp.Load().loadError(getLang("errors", "failedAuthTitle"), getLang("errors", "failedAuthText"))
			}
		})
	}

	// Language Functions
	this.Languages = function() {
		this.loadLanguages = function() {
			global.NovaApp.setLangauges(ini.parse(fs.readFileSync(path.join(__dirname + '/languages/', Language + '.ini'), 'utf-8')));
		}

		// Return Language Section
		this.getLanguageSection = function(langVar) {
			return systemLanguages[langVar]
		}

		// Get Language Var
		this.getLanguageVar = function(section, langVar) {
			return global.NovaApp.Languages().getLanguageSection(section)[langVar]
		}

		return this
	}

	// URI Functions
	this.Uri = function() {
		// Create Context URL with Arguments
		this.createUriWithArguments = function(ServerController, ServerModule, Arguments) {
			var URL = global.NovaApp.getBase() + global.NovaApp.getController(ServerController) + global.NovaApp.getModule(ServerModule) + Arguments

			novaLangLogArgs("prepareContextModule", URL)

			return URL
		}

		// Create Context URL
		this.createUri = function(ServerController, ServerModule) {
			var URL = global.NovaApp.getBase() + global.NovaApp.getController(ServerController) + global.NovaApp.getModule(ServerModule)

			novaLangLogArgs("prepareContextModule", URL)

			return URL
		}

		// Create Context URL with Token
		this.createUriWithToken = function(ServerController, ServerModule) {
			return global.NovaApp.Uri().createUriWithArguments(ServerController, ServerModule, global.NovaApp.getToken())
		}

		return this
	}

	// Load Functions
	this.Load = function() {
		// Load Page Function
		this.loadPage = function(loadPage) {
			win.loadURL(url.format({
				pathname: path.join(__dirname, loadPage),
				protocol: 'file:',
				slashes: true
			}))

			novaLangLogArgs("loadPage", loadPage)
		}

		// Load Error Page Function
		this.loadError = function(title, message) {
			win.loadURL(url.format({
				pathname: path.join(__dirname, 'error.html'),
				protocol: 'file:',
				slashes: true
			}))

			novaLangLog("loadingError")

			global.NovaApp.setError(title, message)
		}

		return this
	}

	// Server Functions
	this.Server = function() {
		// Check if Exists ServerList
		this.checkServers = function(callback) {
			storage.has('serverList', function(error, hasKey) {
				callback(hasKey)
			})
		}

		// Get Server List
		this.getServers = function(callback) {
			storage.get('serverList', function(error, data) {
				callback(data)
			})
		}

		// Update Server List Data
		this.storeServers = function(serverListData) {
			storage.set('serverList', serverListData, function(error) {
				global.NovaApp.setLocalServerList(serverListData)

				novaLangLog("serverListUpdated")
			});
		}

		// Erase the Server List if exists Data Corruption
		this.clearServers = function() {
			global.NovaApp.Server().getServers(function(response) {
				if (response == '{}' || response == 'undefined') {
					storage.clear(function(error) {
						novaLangLog("serverListCleared")
					});
				}
			})
		}

		// Check If an Specific Server Exists
		this.checkServerExistence = function(serverName, callback) {
			global.NovaApp.Server().getServers(function(serverList) {
				callback(serverList[serverName] != 'undefined')
			});
		}

		// Remove Server from the Server List
		this.removeServer = function(serverName) {
			global.NovaApp.Server().checkServerExistence(serverName, function(response) {
				global.NovaApp.Server().getServers(function(serverList) {
					delete serverList[serverName]

					global.NovaApp.Server().storeServers(serverList)
				})
			})
		}

		// Add Server or Update Server to the Server List
		this.addServer = function(serverName) {
			var server = {}

			server[serverName] = {
				base: global.NovaApp.getVar('ServerUri'),
				name: global.NovaApp.getData('name'),
				token: global.NovaApp.getVar('ServerToken')
			}

			global.NovaApp.Server().checkServerExistence(serverName, function(response) {
				if (response == true) {
					global.NovaApp.Server().checkServers(function(response) {
						if (response == true) {
							serverList.push(server)

							global.NovaApp.Server().storeServers(serverList)
						} else {
							global.NovaApp.Server().getServers(function(serverList) {
								var serverList = []

								serverList.push(server)

								global.NovaApp.Server().storeServers(serverList)
							})
						}
					})
				} else {
					global.NovaApp.Server().getServers(function(serverList) {
						serverList[serverName] = server;

						global.NovaApp.Server().storeServers(serverList)
					})
				}
			})
		}

		// Retrieve Server Data
		this.getServer = function(serverName, callback) {
			global.NovaApp.Server().checkServerExistence(serverName, function(response) {
				if (response == true) {
					global.NovaApp.Server().getServers(function(serverList) {
						callback(serverList[serverName])
					})
				} else {
					callback({})
				}
			})
		}

		return this
	}

	// Requests Functions
	this.Requests = function() {
		// Do NovaApp Request
		this.doRequest = function(RequestUri, callback) {
			request(RequestUri, function(error, response, body) {
				if (error) {
					novaLangLog("requestError")

					callback(false)
				} else {
					novaLangLog("requestOK")

					callback({
						Response: response,
						Body: body
					})
				}
			})
		}

		// Check if we're ready to load Server
		this.validateAuth = function(callback) {
			var serverLoaded = false

			global.NovaApp.Requests().doRequest(global.NovaApp.getBase() + global.NovaApp.getController('Hotel') + global.NovaApp.getModule('Client') + global.NovaApp.getToken(), function(response) {
				if (response == false) {
					novaLangLog("serverInvalid")
				} else if (response.Response.headers['content-type'] == 'application/json; charset=utf-8') {
					var answer = JSON.parse(response.Body)

					if (answer.Code == '403') {
						novaLangLog("serverInvalidToken")
					} else {
						novaLangLog("serverOtherAnswer")
					}
				} else if (response.Response.headers['content-type'] == 'text/html; charset=UTF-8') {
					novaLangLog("serverAuthOK")

					serverLoaded = true
				} else {
					novaLangLog("serverWTF")
				}

				callback(serverLoaded)
			})
		}

		// Validate NovaApp Token
		this.validateToken = function(callback) {
			var validToken = false

			global.NovaApp.Requests().doRequest(global.NovaApp.Uri().createUriWithToken('Users', 'UserAuth'), function(response) {
				if (response == false) {
					novaLangLog("serverTokenWTF")
				} else if (response.Response.headers['content-type'] == 'application/json; charset=utf-8') {
					var answer = JSON.parse(response.Body)

					if (answer.Code == '200') {
						novaLangLog("serverTokenOK")

						global.NovaApp.setVar('ServerToken', answer.NewToken)

						validToken = true
					} else {
						novaLangLog("serverInvalidToken")
					}
				} else {
					novaLangLog("serverInvalidToken")
				}

				callback(validToken)
			})

			return this
		}

		// Validate NovaApp Server
		this.validateServer = function(callback) {
			var validServer = false

			global.NovaApp.Requests().doRequest(global.NovaApp.Uri().createUriWithArguments('Engine', 'VersionCheck', '&Version=' + HabVersion), function(response) {
				if (response == false) {
					console.log("[NovaApp] Server is invalid and with errors. Sorry.")
				} else if (response.Response.headers['content-type'] == 'application/json; charset=utf-8') {
					var answer = JSON.parse(response.Body)

					if (answer.Code == '200') {
						novaLangLog("serverOK")

						validServer = true
					} else {
						novaLangLog("serverInvalid")
					}
				} else {
					novaLangLog("serverInvalid")
				}

				callback(validServer)
			})
		}

		// Retrieve Server Data
		this.retrieveServer = function(callback) {
			var success = false

			global.NovaApp.Requests().doRequest(global.NovaApp.Uri().createUriWithToken('Hotel', 'HotelSettings'), function(response) {
				if (response == false) {
					novaLangLog("serverNON")
				} else if (response.Response.headers['content-type'] == 'application/json; charset=utf-8') {
					var answer = JSON.parse(response.Body)

					if (answer.Code == '200') {
						novaLangLog("serverGathOK")

						global.NovaApp.setVar('ServerToken', answer.NewToken)
						global.NovaApp.setData(answer.Client.hotel)

						success = true
					} else {
						novaLangLog("serverInvalid")
					}
				} else {
					novaLangLog("serverInvalid")
				}
			})

			callback(success)
		}

		return this
	}

	// Renderes Functions
	this.Renderers = function() {
		// Get Rendered Server List
		this.renderServerList = function(callback) {
			global.NovaApp.Server().getServers(function(response) {
				var serversHTML = ''

				serversHTML = '<ul class="tweet_list">'

				var even = 1

				for (var key in response) {
					for (var subKey in response[key]) {
						even++

						serversHTML += (even % 2 == 0) ? '<li class="tweet_even">' : '<li>'

						serversHTML += '<b>' + response[key][subKey].name + '</b> (#' + (key + 1) + ')<br/>'

						serversHTML += '<p>Access the Hotel by clicking <a onclick="openServer(\'' + response[key][subKey].base + '\', \'' + response[key][subKey].token + '\');">here</a><p>'

						serversHTML += '</li>'
					}
				}

				serversHTML += '</ul>'

				callback(serversHTML)
			})
		}

		// Set Server Updates
		this.renderNewsHTML = function(callback) {
			var updatesHTML = ''

			global.NovaApp.Requests().doRequest('https://raw.githubusercontent.com/sant0ro/Nova/master/SERVER_MESSAGES.json', function(response) {
				if (response == false) {
					console.log("[NovaApp] Can't communicate with Nova Repository..")
				} else {
					var answer = JSON.parse(response.Body)

					updatesHTML = '<ul class="tweet_list">'

					var even = 0

					answer.messages.forEach(function(entry) {
						even++

						updatesHTML += (even % 2 == 0) ? '<li class="tweet_even">' : '<li>'

						updatesHTML += entry.message

						updatesHTML += '</li>'
					});

					updatesHTML += '</ul>'
				}

				callback(updatesHTML)
			});
		}

		return this
	}

	// Get Server Base URI + Server Base
	this.getBase = function() {
		return this.getVar('ServerProtocol') + this.getVar('ServerUri') + this.getVar('ServerBase')
	}

	// Get Server Token
	this.getToken = function() {
		return this.getModule('Token') + this.getVar('ServerToken')
	}

	// Get NovaApp Variable
	this.getVar = function(VarName) {
		return variables[VarName]
	}

	// Set a Variable Value
	this.setVar = function(VarName, VarValue) {
		variables[VarName] = VarValue
	}

	// Get NovaApp Controllers
	this.getController = function(VarName) {
		return controllers[VarName]
	}

	// Get NovaApp Modules
	this.getModule = function(VarName) {
		return modules[VarName]
	}

	// Get Error Message
	this.getError = function() {
		return errorVars
	}

	// Set the Error Message
	this.setError = function(title, message) {
		errorVars["Title"] = title, errorVars["Message"] = message
	}

	// Get App Latest News
	this.getUpdates = function() {
		return lastUpdatesHTML
	}

	// Set App Latest News
	this.setUpdates = function(updatesHTML) {
		lastUpdatesHTML = updatesHTML
	}

	// Set Server Data
	this.setData = function(servData) {
		serverData = servData
	}

	// Get Server Data
	this.getData = function(servVar) {
		return serverData[servVar]
	}

	// Get Local Server List
	this.getLocalServerList = function() {
		return localServerList
	}

	// Set Local Server List
	this.setLocalServerList = function(list) {
		localServerList = list
	}

	// Get Languages
	this.getLanguages = function() {
		return systemLanguages;
	}

	// Set Languages
	this.setLangauges = function(languageFiles) {
		systemLanguages = languageFiles;
	}
}

// Instantiates NovaApp
global.NovaApp = new NovaApp();

// Get Language Variable
function getLang(section, langVar) {
	return global.NovaApp.Languages().getLanguageVar(section, langVar)
}

// Check Server Vality
function checkServer(serverName) {
	console.log("[NovaApp] Starting Server Validation")

	global.NovaApp.setVar('ServerUri', serverName)
	global.NovaApp.Requests().validateServer(function(response) {
		if (response == false) {
			global.NovaApp.Load().loadError(getLang("errors", "invalidServerTitle"), getLang("errors", "invalidServerText"))
		} else {
			global.NovaApp.Load().loadPage('token.html')
		}
	})
}

// Check Token Function
function checkToken(serverToken) {
	console.log("[NovaApp] Starting Token Validation")

	global.NovaApp.setVar('ServerToken', serverToken)
	global.NovaApp.Requests().validateToken(function(response) {
		if (response == false) {
			global.NovaApp.Load().loadError(getLang("errors", "invalidTokenTitle"), getLang("errors", "invalidTokenText"))
		} else {
			global.NovaApp.initHab(true);
		}
	})
}

// Go Back to Home Page
function goBack() {
	global.NovaApp.Load().loadPage('index.html')
}

// Get Local Server List
function getServerList(callback) {
	global.NovaApp.Renderers().renderServerList(function(response) {
		callback(response)
	})
}

// Get getError Message
function getError() {
	return global.NovaApp.getError();
}

// Get Last News HTML
function getUpdates() {
	return global.NovaApp.getUpdates();
}

// Start Specific Server
function startSpecificServer(serverUri, userToken) {
	novaLangLog("startSpecificServer")

	global.NovaApp.setVar('ServerUri', serverUri)
	global.NovaApp.setVar('ServerToken', userToken)
	global.NovaApp.initHab(false);
}

// Go to Main Page
function addNewServer() {
	global.NovaApp.Load().loadPage('index.html')
}

// Got to Server List
function goToServerList(callback) {
	global.NovaApp.Server().checkServers(function(response) {
		if (response == true) {
			global.NovaApp.Load().loadPage('servers.html')
		} else {
			callback(false)
		}
	})
}

// Logout User
function logOut() {
	global.NovaApp.Load().loadPage('index.html')
}

// Exports logOut checkServer Method
exports.logOut = logOut

// Exports addNewServer checkServer Method
exports.addNewServer = addNewServer

// Exports goToServerList checkServer Method
exports.goToServerList = goToServerList

// Exports startSpecificServer checkServer Method
exports.startSpecificServer = startSpecificServer

// Exports getServerList checkServer Method
exports.getServerList = getServerList

// Exports NovaApp checkServer Method
exports.checkServer = checkServer

// Exports NovaApp goBack Method
exports.goBack = goBack

// Exports NovaApp errorMessage Method
exports.getError = getError

// Exports NovaApp checkToken Method
exports.checkToken = checkToken

// Exports NovaApp getUpdates Method
exports.getUpdates = getUpdates

// Create Context Window
function createWindow() {
	winLoading = new BrowserWindow({
		width: 420,
		height: 320,
		center: true,
		resizable: false,
		frame: false,
		minimizable: false,
		acceptFirstMouse: false,
		maximizable: false,
		movable: false,
	})

	// Load Main File
	winLoading.loadURL(url.format({
		pathname: path.join(__dirname, 'loading.html'),
		protocol: 'file:',
		slashes: true
	}))

	novaLog("Loading Language System...")

	// Load Languages
	global.NovaApp.Languages().loadLanguages();

	novaLangLog("startupNews")

	// Set Server Updates
	global.NovaApp.Renderers().renderNewsHTML(function(response) {
		global.NovaApp.setUpdates(response);

		setTimeout(function() {
			novaLangLog("startupContextWindow")

			win = new BrowserWindow({
				width: 900,
				height: 700,
				center: true,
				webPreferences: {
					plugins: true,
					allowRunningInsecureContent: true
				}
			})

			novaLangLog("startupLaunchContextWindow")

			// Check Data Corruption
			global.NovaApp.Server().clearServers()

			// Only Uncomment for Development
			// storage.clear(function(error) {
			//    if (error)
			//     throw error;
			//   }
			// );

			// Load Main File
			global.NovaApp.Server().checkServers(function(response) {
				global.NovaApp.Load().loadPage(response == true ? 'servers.html' : 'index.html')
			});

			// Close Loading Window
			winLoading.close()

			novaLangLog("startupReady")

			// Emitted when the window is closed.
			win.on('closed', () => {
				// Dereference the window object, usually you would store windows
				// in an array if your app supports multi windows, this is the time
				// when you should delete the corresponding element.
				win = null

				novaLangLog("startupBye")

				app.quit()
			})
		}, 1000);

		// Emitted when the window is closed.
		winLoading.on('closed', () => {
			// Dereference the window object, usually you would store windows
			// in an array if your app supports multi windows, this is the time
			// when you should delete the corresponding element.
			winLoading = null

			novaLangLog("startupLoadingOK")
		})
	});

	// Create the Application's main menu
	var template = [{
		label: "NovaApp",
		submenu: [{
			label: "About Application",
			selector: "orderFrontStandardAboutPanel:"
		}, {
			type: "separator"
		}, {
			label: "Quit",
			accelerator: "Command+Q",
			click: function() {
				app.quit();
			}
		}]
	}, {
		label: "Edit",
		submenu: [{
			label: "Undo",
			accelerator: "CmdOrCtrl+Z",
			selector: "undo:"
		}, {
			label: "Redo",
			accelerator: "Shift+CmdOrCtrl+Z",
			selector: "redo:"
		}, {
			type: "separator"
		}, {
			label: "Cut",
			accelerator: "CmdOrCtrl+X",
			selector: "cut:"
		}, {
			label: "Copy",
			accelerator: "CmdOrCtrl+C",
			selector: "copy:"
		}, {
			label: "Paste",
			accelerator: "CmdOrCtrl+V",
			selector: "paste:"
		}, {
			label: "Select All",
			accelerator: "CmdOrCtrl+A",
			selector: "selectAll:"
		}]
	}];

	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow()
	}
})
