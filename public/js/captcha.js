/**
 * Simple CAPTCHA generator for client-side validation
 * This implementation uses canvas drawing to create a visually challenging security check
 * that works without any external dependencies or dynamic code evaluation.
 */
(function() {
  // Define the SimpleCaptcha class in a self-contained scope
  function SimpleCaptcha(canvas, reloadButton) {
    this.canvas = canvas;
    this.reloadButton = reloadButton;
    this.value = '';
    this.init();
  }
  
  // Initialize the captcha
  SimpleCaptcha.prototype.init = function() {
    // Generate initial CAPTCHA
    this.generate();
    
    // Add event listener for reload button
    if (this.reloadButton) {
      var self = this;
      this.reloadButton.addEventListener('click', function(e) {
        e.preventDefault();
        self.generate();
      });
    }
  };
  
  // Generate a new captcha value and render it
  SimpleCaptcha.prototype.generate = function() {
    var ctx = this.canvas.getContext('2d');
    var width = this.canvas.width;
    var height = this.canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background color
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    // Generate random CAPTCHA text (5-6 characters)
    var characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    var length = Math.floor(Math.random() * 2) + 5; // 5-6 characters
    
    var captchaText = '';
    for (var i = 0; i < length; i++) {
      captchaText += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Store CAPTCHA value
    this.value = captchaText;
    
    // Draw CAPTCHA text
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add noise and distortion
    this._addNoise(ctx, width, height);
    
    // Draw each character with slight rotation
    var charWidth = width / (captchaText.length + 1);
    
    for (var i = 0; i < captchaText.length; i++) {
      var char = captchaText.charAt(i);
      var x = (i + 1) * charWidth;
      var y = height / 2 + Math.random() * 10 - 5;
      var rotation = Math.random() * 0.4 - 0.2; // Random rotation between -0.2 and 0.2 radians
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Random color for each character
      ctx.fillStyle = this._getRandomColor();
      ctx.fillText(char, 0, 0);
      
      ctx.restore();
    }
    
    // Add more noise on top
    this._addNoiseLines(ctx, width, height);
  };
  
  // Validate user input against captcha value
  SimpleCaptcha.prototype.validate = function(userInput) {
    return userInput.trim().toLowerCase() === this.value.toLowerCase();
  };
  
  // Add random dots to the canvas
  SimpleCaptcha.prototype._addNoise = function(ctx, width, height) {
    // Add random dots
    for (var i = 0; i < width * height * 0.05; i++) {
      var x = Math.random() * width;
      var y = Math.random() * height;
      
      ctx.fillStyle = this._getRandomColor(0.5);
      ctx.fillRect(x, y, 1, 1);
    }
  };
  
  // Add random lines to the canvas
  SimpleCaptcha.prototype._addNoiseLines = function(ctx, width, height) {
    // Add random lines
    for (var i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.strokeStyle = this._getRandomColor(0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };
  
  // Generate a random color
  SimpleCaptcha.prototype._getRandomColor = function(alpha) {
    alpha = alpha || 1;
    var r = Math.floor(Math.random() * 200);
    var g = Math.floor(Math.random() * 200);
    var b = Math.floor(Math.random() * 200);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  };
  
  // Expose the SimpleCaptcha constructor globally
  window.SimpleCaptcha = SimpleCaptcha;
})();
