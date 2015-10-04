/*
Copyright 2011 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eric Bidelman (ericbidelman@chromium.org)
*/

const newline = '<div class="one-liner">';

var util = util || {};
util.toArray = function(list) {
  return Array.prototype.slice.call(list || [], 0);
};

// Cross-browser impl to get document's height.
util.getDocHeight = function() {
  var d = document;
  return Math.max(
      Math.max(d.body.scrollHeight, d.documentElement.scrollHeight),
      Math.max(d.body.offsetHeight, d.documentElement.offsetHeight),
      Math.max(d.body.clientHeight, d.documentElement.clientHeight)
  );
};


/* TODO(ericbidelman): add fallback to html5 audio.
function Sound(opt_loop) {
  var self_ = this;
  var context_ = null;
  var source_ = null;
  var loop_ = opt_loop || false;

  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  if (window.AudioContext) {
    context_ = new window.AudioContext();
  }

  this.load = function(url, mixToMono, opt_callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      if (context_) {
        self_.sample = context_.createBuffer(this.response, mixToMono);
        if (opt_callback) {
          opt_callback();
        }
        context_.decodeAudioData(this.response, function(audioBuffer) {
          self_.sample = audioBuffer;
          opt_callback && opt_callback();
        }, function(e) {
          console.log(e);
        });
      }
    };
    xhr.send();
  };


  this.play = function() {
    if (context_) {
      source_ = context_.createBufferSource();
      source_.buffer = self_.sample;
      source_.looping = loop_;
      source_.connect(context_.destination);
      source_.noteOn(0);
    }
  };

  this.stop = function() {
    if (source_) {
      source_.noteOff(0);
      source_.disconnect(0);
    }
  };
}
*/
var Terminal = Terminal || function(containerId) {
  window.URL = window.URL || window.webkitURL;
  window.requestFileSystem = window.requestFileSystem ||
                             window.webkitRequestFileSystem;

  const VERSION_ = '0.5.1';
    
  const CMDS_ = [
    'help', 'about', 'units', 'info', 'systems', 'launch', 'orbit', 'jump'
  ];
    
  const THEMES_ = ['default'];

  var fs_ = null;
  var cwd_ = null;
  var history_ = [];
  var histpos_ = 0;
  var histtemp_ = 0;

  var timer_ = null;
  var magicWord_ = null;

  var fsn_ = null;

  // Fire worker to return recursive snapshot of current FS tree.
//  var worker_ = new Worker('worker.js');
//  worker_.onmessage = function(e) {
//    var data = e.data;
//    if (data.entries) {
//      fsn_.contentWindow.postMessage({cmd: 'build', data: data.entries},
//                                     window.location.origin);
//    }
//    if (data.msg) {
//      output('<div>' + data.msg + '</div>');
//    }
//  };
//  worker_.onerror = function(e) { console.log(e) };

  // Create terminal and cache DOM nodes;
  var container_ = document.getElementById(containerId);
  container_.insertAdjacentHTML('beforeEnd',
      ['<output></output>',
       '<div id="input-line" class="input-line">',
       '<div class="prompt">&gt;</div><div><input class="cmdline" autofocus /></div>',
       '</div>'].join(''));
  var cmdLine_ = container_.querySelector('#input-line .cmdline');
  var output_ = container_.querySelector('output');
  var interlace_ = document.querySelector('.interlace');
//  var bell_ = new Sound(false);
//  bell_.load('beep.mp3', false);

  // Hackery to resize the interlace background image as the container grows.
  output_.addEventListener('DOMSubtreeModified', function(e) {
    var docHeight = util.getDocHeight();
    document.documentElement.style.height = docHeight + 'px';
    //document.body.style.background = '-webkit-radial-gradient(center ' + (Math.round(docHeight / 2)) + 'px, contain, rgba(0,75,0,0.8), black) center center no-repeat, black';
    interlace_.style.height = docHeight + 'px';
    setTimeout(function() { // Need this wrapped in a setTimeout. Chrome is jupming to top :(
      //window.scrollTo(0, docHeight);
      cmdLine_.scrollIntoView();
    }, 0);
    //window.scrollTo(0, docHeight);
  }, false);

  output_.addEventListener('click', function(e) {
    var el = e.target;
    if (el.classList.contains('file') || el.classList.contains('folder')) {
      cmdLine_.value += ' ' + el.textContent;
    }
  }, false);

  window.addEventListener('click', function(e) {
    //if (!document.body.classList.contains('offscreen')) {
      cmdLine_.focus();
    //}
  }, false);

  // Always force text cursor to end of input line.
  cmdLine_.addEventListener('click', inputTextClick_, false);

  // Handle up/down key presses for shell history and enter for new command.
  cmdLine_.addEventListener('keydown', keyboardShortcutHandler_, false);
  cmdLine_.addEventListener('keyup', historyHandler_, false); // keyup needed for input blinker to appear at end of input.
  cmdLine_.addEventListener('keydown', processNewCommand_, false);

  /*window.addEventListener('beforeunload', function(e) {
    return "Don't leave me!";
  }, false);*/
    
  function cmd_help(args) {
    output("List of available commands:");
    output('<div class="ls-files">' + CMDS_.join('<br>') + '</div>');  
  }
    
  function cmd_about(args) {
     output("You are one of two Controller units designed for the Automated Galactic Expansion Movement (AGEM). You must Colonize."); 
  }
    
  function cmd_systems(args) {
      var systemNames = [];
      for(var i=0; i<solarSystems.length; i++){
        systemNames[i] = solarSystems[i].getName();
      }
      output("List of discovered solar systems:");
      output('<div class="ls-files">' + systemNames.join('<br>') + '</div>');  
  }
    
  function cmd_units(args) {
      var vesselNames = [];
      for(var i=0; i<vessels.length; i++){
        vesselNames[i] = vessels[i].getName();
      }
      output("List of available Seeding Pod Vessels:");
      output('<div class="ls-files">' + vesselNames.join('<br>') + '</div>');
  }
    
  function cmd_orbit(args) {
      if(args.length>0) {
          switch(args[0]) {
              case 'vessel':
                if(args.length>1) {
                    var id = TryParseInt(args[1], 0);
                    if(id>0 && id<=vessels.length) {
                        var vessel = vessels[id-1];

                        if(args.length>2) {
                            var planetName = args[2].toString();
                            var targetPlanet = getPlanet(planetName);
                            
                            if(targetPlanet == null) {
                                output('Planet ' + planetName + ' is not available.');
                                return;
                            }
                                                            
                            if(arrayContains(targetPlanet, vessel.system.planets)) {
                                vessel.orbit(targetPlanet);
                                output(newline + vessel.getName() + ' now orbiting planet ' + vessel.targetPlanet.getName() + '.');
                                output(newline);
                            } else {
                                output(newline + 'Orbit unsuccessful.');
                                output(newline + 'Planet ' + targetPlanet.getName() + ' is in the ' + targetPlanet.system.getName() + ' System.');
                                output(newline +  vessel.getName() + ' must jump to the ' + targetPlanet.system.getName() + ' System before orbiting ' + targetPlanet.getName() + '.');
                                output(newline);
                            }
                            
                        } else {
                            output('usage: orbit vessel id planet');
                        }

                    } else { // If the ID is out of bounds of array
                        output(newline + 'Vessel with id \'' + id + '\'' + ' is not available.');
                    }
                } else {
                    output('usage: orbit vessel id planet');
                }
                break;
              default:
                  output('usage: orbit vessel id planet');
                  break;
          }                  
      } else {
        output('usage: orbit vessel id planet');
      }
  }
    
  function cmd_launch(args) {
      if(args.length>1) {
        var id = TryParseInt(args[1], 0);
        if(id>0 && id<=podList.length) {
            var pod = podList[id-1];
            var podVessel = vessels[pod.vesselID];
            
            if(podVessel.targetPlanet == null){
                output(newline + 'Vessel ' + pod.vesselID + ' launch sequence initiated.');
                output(newline + 'Pod ' + id + ' launch unsuccessful.');
                output(newline + 'Vessel ' + pod.vesselID + ' is not in orbit of any planet.' );
                output(newline);
                return;
            } else {
                pod.launch(podVessel.targetPlanet);
            }

            output(newline + 'Vessel ' + pod.vesselID + ' launch sequence initiated.');
            output(newline + 'Pod ' + id + ' launch successful.');
            output(newline + 'Pod standing by on planet: ' + pod.planet.getName());
            output(newline);

        } else { // If the ID is out of bounds of array
            output(newline + 'Pod with id \'' + id + '\'' + ' is not available.');
        }
      } else {
        output('usage: launch pod id');
      }
  }
    
  function cmd_info(args) {
    if(args.length>0) {
        switch(args[0]) {
            case 'vessel':
                if(args.length>1) {
                    var id = TryParseInt(args[1], 0);
                    if(id>0 && id<=vessels.length){
                        var vessel = vessels[id-1];
                        output(vessel.getStatus());
                        output(newline + 'Hull Integrity: ' + vessel.getIntegrity());
                        output(newline + vessel.getLocation());
                        output(newline + 'List of Seeding Pods docked on ' + vessel.getName() + ':');
                        output(newline);

                        var podNames = [];

                        for(i=0; i<vessel.pods.length; i++){
                            podNames[i] = '[' + vessel.pods[i].getName() + ']';
                        }

                        output('<div class="ls-files">' + podNames.join('<br>') + '</div>');
                    } else { // If the ID is out of bounds of array
                        output(newline + 'Vessel with id \'' + id + '\'' + ' is not available.');
                    }
                } else {
                    output('usage: info object id');
                }
                break;
            case 'pod':
                if(args.length>1) {
                    var id = TryParseInt(args[1], 0);
                    if(id>0 && id<=podList.length) {
                        var pod = podList[id-1];
                        output(newline + 'Status of Pod ' + id + ':');
                        output(newline + 'Hull Integrity: ' + pod.getIntegrity());
                        output(newline + 'Location: ' + pod.getLocation());
                        output(newline + 'Forces: ' + pod.forces);
                        output(newline);
                    } else { // If the ID is out of bounds of array
                        output(newline + 'Pod with id \'' + id + '\'' + ' is not available.');
                    }
                } else {
                    output('usage: info object id');
                }
                break;
            case 'system':
                if(args.length>1) {
                    var name = args[1];

                    var desiredSystem;

                    for(var i=0; i<solarSystems.length; i++) {
                        if(solarSystems[i].getName().toLowerCase() == name){
                            desiredSystem = solarSystems[i];
                            break;
                        }
                    }

                    if(desiredSystem != null){
                        output(newline + 'Information on the ' + desiredSystem.getName() + ' system: ');
                        output(newline + 'List of all planets in the ' + desiredSystem.getName() + ' system: ');

                        var planetNames = [];
                        for(var i=0; i<desiredSystem.planets.length; i++){
                            planetNames[i] = desiredSystem.planets[i].getName();
                        }

                        output('<div class="ls-files">' + planetNames.join('<br>') + '</div>');
                        output(newline);                            
                    } else {                            
                        output(newline + 'System with name \'' + name + '\'' + ' is not available.');
                    }
                } else {
                    output('usage: info object id');
                }
                break;
            case 'planet':
                if(args.length>1) {
                    var name = args[1];

                    var desiredPlanet;

                    for(var i=0; i<planets.length; i++) {
                        if(planets[i].getName().toLowerCase() == name){
                            desiredPlanet = planets[i];
                            break;
                        }
                    }

                    if(desiredPlanet != null){
                        output(newline + 'Information on planet ' + desiredPlanet.getName() + ': ');
                        output(newline + 'List of all biomes detected on planet ' + desiredPlanet.getName() + ': ');

                        var biomeNames = [];
                        for(var i=0; i<desiredPlanet.biomes.length; i++){
                            biomeNames[i] = desiredPlanet.biomes[i].getName();
                        }

                        output('<div class="ls-files">' + biomeNames.join('<br>') + '</div>');
                        output(newline + 'Number of hostile forces detected: ' + desiredPlanet.forces);
                        output(newline);                            
                    } else {                            
                        output(newline + 'Planet with name \'' + name + '\'' + ' is not available.');
                    }
                } else {
                    output('usage: info object id');
                }
                break; 
            default:
                output('usage: info object id');
                break;
        }
      } else {
        output('usage: info object id');
      }  
  }
    
  function cmd_jump(args) {
  }
    
  function inputTextClick_(e) {
    this.value = this.value;
  }

  function keyboardShortcutHandler_(e) {
    // Toggle CRT screen flicker.
//    if ((e.ctrlKey || e.metaKey) && e.keyCode == 83) { // crtl+s
//      container_.classList.toggle('flicker');
//      output('<div>Screen flicker: ' +
//             (container_.classList.contains('flicker') ? 'on' : 'off') +
//             '</div>');
//      e.preventDefault();
//      e.stopPropagation();
//    }
  }

  function selectFile_(el) {
    alert(el)
  }

  function historyHandler_(e) { // Tab needs to be keydown.

    if (history_.length) {
      if (e.keyCode == 38 || e.keyCode == 40) {
        if (history_[histpos_]) {
          history_[histpos_] = this.value;
        } else {
          histtemp_ = this.value;
        }
      }

      if (e.keyCode == 38) { // up
        histpos_--;
        if (histpos_ < 0) {
          histpos_ = 0;
        }
      } else if (e.keyCode == 40) { // down
        histpos_++;
        if (histpos_ > history_.length) {
          histpos_ = history_.length;
        }
      }

      if (e.keyCode == 38 || e.keyCode == 40) {
        this.value = history_[histpos_] ? history_[histpos_] : histtemp_;
        this.value = this.value; // Sets cursor to end of input.
      }
    }
  }

  function processNewCommand_(e) {
      
    // Beep on backspace and no value on command line.
//    if (!this.value && e.keyCode == 8) {
//      bell_.stop();
//      bell_.play();
//      return;
//    }

    if (e.keyCode == 9) { // Tab
      e.preventDefault();
      // TODO(ericbidelman): Implement tab suggest.
    } else if (e.keyCode == 13) { // enter

      // Save shell history.
      if (this.value) {
        history_[history_.length] = this.value;
        histpos_ = history_.length;
      }

      // Duplicate current input and append to output section.
      var line = this.parentNode.parentNode.cloneNode(true);
      line.removeAttribute('id')
      line.classList.add('line');
      var input = line.querySelector('input.cmdline');
      input.autofocus = false;
      input.readOnly = true;
      output_.appendChild(line);

      // Parse out command, args, and trim off whitespace.
      // TODO(ericbidelman): Support multiple comma separated commands.
      if (this.value && this.value.trim()) {
        this.value = this.value.toLowerCase();
          
        var args = this.value.split(' ').filter(function(val, i) {
          return val;
        });
        var cmd = args[0];
          
        args = args.splice(1); // Remove cmd from arg list.
      }

      switch (cmd) {       
        case 'help':
          cmd_help(args);
          break;
        case 'about':
          cmd_about(args);
          break;
         case 'systems':
          cmd_systems(args);
          break;  
        case 'units':
          cmd_units(args);
          break;
        case 'orbit':
          cmd_orbit(args);
          break;        
        case 'launch':
          cmd_launch(args);
          break;                     
        case 'info':
          cmd_info(args);
          break;            
        case 'version':
        case 'ver':
          output(VERSION_);
          break;
        case 'wget':
          var url = args[0];
          if (!url) {
            output(['usage: ', cmd, ' missing URL'].join(''));
            break;
          } else if (url.search('^http://') == -1) {
            url = 'http://' + url;
          }
          var xhr = new XMLHttpRequest();
          xhr.onload = function(e) {
            if (this.status == 200 && this.readyState == 4) {
              output('<textarea>' + this.response + '</textarea>');
            } else {
              output('ERROR: ' + this.status + ' ' + this.statusText);
            }
          };
          xhr.onerror = function(e) {
            output('ERROR: ' + this.status + ' ' + this.statusText);
            output('Could not fetch ' + url);
          };
          xhr.open('GET', url, true);
          xhr.send();
          break;
        case 'who':
          output(document.title +
                 ' - By: Eric Bidelman &lt;ericbidelman@chromium.org&gt;');
          break;
        default:
          if (cmd) {
            output(cmd + ': command not found');
          }
      };

      this.value = ''; // Clear/setup line for next input.
    }
  }

  function formatColumns_(entries) {
    var maxName = entries[0].name;
    util.toArray(entries).forEach(function(entry, i) {
      if (entry.name.length > maxName.length) {
        maxName = entry.name;
      }
    });

    // If we have 3 or less entries, shorten the output container's height.
    // 15px height with a monospace font-size of ~12px;
    var height = entries.length == 1 ? 'height: ' + (entries.length * 30) + 'px;' :
                 entries.length <= 3 ? 'height: ' + (entries.length * 18) + 'px;' : '';

    // ~12px monospace font yields ~8px screen width.
    var colWidth = maxName.length * 16;//;8;

    return ['<div class="ls-files" style="-webkit-column-width:',
            colWidth, 'px;', height, '">'];
  }

  function invalidOpForEntryType_(e, cmd, dest) {
    if (e.code == FileError.NOT_FOUND_ERR) {
      output(cmd + ': ' + dest + ': No such file or directory<br>');
    } else if (e.code == FileError.INVALID_STATE_ERR) {
      output(cmd + ': ' + dest + ': Not a directory<br>');
    } else if (e.code == FileError.INVALID_MODIFICATION_ERR) {
      output(cmd + ': ' + dest + ': File already exists<br>');
    } else {
      errorHandler_(e);
    }
  }

  function errorHandler_(e) {
    var msg = '';
    switch (e.code) {
      case FileError.QUOTA_EXCEEDED_ERR:
        msg = 'QUOTA_EXCEEDED_ERR';
        break;
      case FileError.NOT_FOUND_ERR:
        msg = 'NOT_FOUND_ERR';
        break;
      case FileError.SECURITY_ERR:
        msg = 'SECURITY_ERR';
        break;
      case FileError.INVALID_MODIFICATION_ERR:
        msg = 'INVALID_MODIFICATION_ERR';
        break;
      case FileError.INVALID_STATE_ERR:
        msg = 'INVALID_STATE_ERR';
        break;
      default:
        msg = 'Unknown Error';
        break;
    };
    output('<div>Error: ' + msg + '</div>');
  }

  function createDir_(rootDirEntry, folders, opt_errorCallback) {
    var errorCallback = opt_errorCallback || errorHandler_;

    rootDirEntry.getDirectory(folders[0], {create: true}, function(dirEntry) {

      // Recursively add the new subfolder if we still have a subfolder to create.
      if (folders.length) {
        createDir_(dirEntry, folders.slice(1));
      }
    }, errorCallback);
  }

  function open_(cmd, path, successCallback) {
    if (!fs_) {
      return;
    }

    cwd_.getFile(path, {}, successCallback, function(e) {
      if (e.code == FileError.NOT_FOUND_ERR) {
        output(cmd + ': ' + path + ': No such file or directory<br>');
      }
    });
  }

  function read_(cmd, path, successCallback) {
    if (!fs_) {
      return;
    }

    cwd_.getFile(path, {}, function(fileEntry) {
      fileEntry.file(function(file) {
        var reader = new FileReader();

        reader.onloadend = function(e) {
          successCallback(this.result);
        };

        reader.readAsText(file);
      }, errorHandler_);
    }, function(e) {
      if (e.code == FileError.INVALID_STATE_ERR) {
        output(cmd + ': ' + path + ': is a directory<br>');
      } else if (e.code == FileError.NOT_FOUND_ERR) {
        output(cmd + ': ' + path + ': No such file or directory<br>');
      }
    });
  }

  function ls_(successCallback) {
    if (!fs_) {
      return;
    }

    // Read contents of current working directory. According to spec, need to
    // keep calling readEntries() until length of result array is 0. We're
    // guarenteed the same entry won't be returned again.
    var entries = [];
    var reader = cwd_.createReader();

    var readEntries = function() {
      reader.readEntries(function(results) {
        if (!results.length) {
          entries = entries.sort();
          successCallback(entries);
        } else {
          entries = entries.concat(util.toArray(results));
          readEntries();
        }
      }, errorHandler_);
    };

    readEntries();
  }

  function clear_(input) {
    output_.innerHTML = '';
    input.value = '';
    document.documentElement.style.height = '100%';
    interlace_.style.height = '100%';
  }

  function setTheme_(theme) {
    var currentUrl = document.location.pathname;

    if (!theme || theme == 'default') {
      //history.replaceState({}, '', currentUrl);
      localStorage.removeItem('theme');
      document.body.className = '';
      return;
    }

    if (theme) {
      document.body.classList.add(theme);
      localStorage.theme = theme;
      //history.replaceState({}, '', currentUrl + '#theme=' + theme);
    }
  }

  function output(html) {
    output_.insertAdjacentHTML('beforeEnd', html);
    //output_.scrollIntoView();
    cmdLine_.scrollIntoView();
  }

  return {
    initFS: function(persistent, size) {
      output('<div>Booting... ControlOS (v' + VERSION_ + ') successfully booted. </div>');
      output('<div>Connecting...<div>');
      output('<div>Successfully connected to MACHNET <div>');
//      output((new Date()).toLocaleString());
      output('<p>Awaiting your command:</p>');

      if (!!!window.requestFileSystem) {
        output('<div>Sorry! The FileSystem APIs are not available in your browser.</div>');
        return;
      }

      var type = persistent ? window.PERSISTENT : window.TEMPORARY;
      window.requestFileSystem(type, size, function(filesystem) {
        fs_ = filesystem;
        cwd_ = fs_.root;
        type_ = type;
        size_ = size;

        // If we get this far, attempt to create a folder to test if the
        // --unlimited-quota-for-files fag is set.
        cwd_.getDirectory('testquotaforfsfolder', {create: true}, function(dirEntry) {
          dirEntry.remove(function() { // If successfully created, just delete it.
            // noop.
          });
        }, function(e) {
          if (e.code == FileError.QUOTA_EXCEEDED_ERR) {
            output('ERROR: Write access to the FileSystem is unavailable.<br>');
            output('Type "install" or run Chrome with the --unlimited-quota-for-files flag.');
          } else {
            errorHandler_(e);
          }
        });

      }, errorHandler_);
    },
    output: output,
    setTheme: setTheme_,
    getCmdLine: function() { return cmdLine_; },
    addDroppedFiles: function(files) {
      util.toArray(files).forEach(function(file, i) {
        cwd_.getFile(file.name, {create: true, exclusive: true}, function(fileEntry) {

          // Tell FSN visualizer we've added a file.
          if (fsn_) {
            fsn_.contentWindow.postMessage({cmd: 'touch', data: file.name}, location.origin);
          }
          
          fileEntry.createWriter(function(fileWriter) {
            fileWriter.write(file);
          }, errorHandler_);
        }, errorHandler_);
      });
    },
    selectFile: selectFile_
  }
};

