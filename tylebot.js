let XMLHttpRequest = require('xhr2');

module.exports = class{
	constructor(token){
		this.onready = () => console.warn("Not ready function declared!");

		this.token = token;
		this.url = `https://api.telegram.org/bot${this.token}/getUpdates?timeout=3600`;
		this.basic = `https://api.telegram.org/bot${this.token}/`;


		let request = new XMLHttpRequest();
		request.open('GET', this.url);
		request.onreadystatechange = () => {
			if(request.readyState === 4){
				if(request.status === 200){
					this.lastUpdate = JSON.parse(request.responseText);
					if(this.lastUpdate.result.length === 0) throw new Error("No updates found for setup, start the bot or send a message to it before using Telebot!\n\n");
					else this.onready();
				}
				else{
					this.token = undefined;
					this.url = undefined;
					throw new Error("You have enterned a not valid token!\n\n");
				}
			}
		};

		request.send();
	}

	get lastUpdateNumber(){
		return this.lastUpdate.result[this.lastUpdate.result.length - 1].update_id;
	}

	listen(feed){
		let lastUpdateNumber = this.lastUpdateNumber;
		let tempUrl = this.url + "&offset=" + (lastUpdateNumber + 1).toString();

		// let keepAlive = setInterval(() => undefined, 3000000);
		
		let reboot = () => {
			if(this.token){
				let request = new XMLHttpRequest();
				request.open('GET', tempUrl);
				request.onreadystatechange = () => {
					if(request.readyState === 4){
						if(request.status === 200){
							let response = JSON.parse(request.responseText);
							if(response.result.length > 0){
								lastUpdateNumber++;
								tempUrl = this.url + "&offset=" + (lastUpdateNumber + 1).toString();
								feed(response.result[0]);
							}
							reboot();
						}
						else{
							reboot = undefined;
							request = undefined;

							throw new Error("Telegram bots api may not work!\n\n");
						}
					}
				};
				request.send();
			}
		}





		const methods = {
			send: 'sendMessage',
			delete: 'deleteMessage'
		}

		for(let i in methods){
			this[i] = function(options, result = () => undefined){
				this.method(methods[i], options, result);
			};
		};






		reboot();
	
	}

	getMe(){
		return new Promise((resolve, reject) => {
			let request = new XMLHttpRequest();
			request.open('GET', this.basic + "getMe");
			request.onreadystatechange = () => {
				if(request.readyState === 4){
					if(request.status === 200) resolve(JSON.parse(request.responseText));
					else reject("Error while trying to use getMe method! (Telegram API didn't sent data)");
				}
			}
			request.send();
		});
	}


	method(method, options, result = () => undefined){
		let optionsString = this.basic + method + "?";
		for(let i in options){
			optionsString += i + "=" + encodeURIComponent(options[i]) + "&";
		}

		optionsString = optionsString.substring(0, optionsString.length - 1);

		let request = new XMLHttpRequest();
		request.open('GET', optionsString);
		request.onreadystatechange = function(){
			if(request.readyState === 4){
				result(request.responseText);
			}
		}
		request.send();
	}

}

String.prototype.command = function(){
	return this.toString().toLowerCase().split(' ')[0];
}

String.prototype.arguments = function(){
	return this.toString().split(' ').splice(1);
}
