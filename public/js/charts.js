/**
 * CANVAS & SVG CHART VISUALIZATION ENGINE
 * High-performance, responsive canvas charts for financial analytics
 */

export const ChartEngine = {
  /**
   * Draw Radial Circular Score Gauge
   */
  renderScoreGauge(canvasId, score, maxScore = 100, color = '#10B981') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = 240;
    const height = canvas.height = 240;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 95;
    const strokeWidth = 14;

    ctx.clearRect(0, 0, width, height);

    // Track Background Arc (240 degree arc)
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Progress Arc
    const progressPercent = Math.max(0, Math.min(1, score / maxScore));
    const currentEndAngle = startAngle + (progressPercent * (endAngle - startAngle));

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, currentEndAngle, false);
    ctx.lineWidth = strokeWidth;

    // Create Gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (color === '#10B981') {
      grad.addColorStop(0, '#10B981');
      grad.addColorStop(1, '#34D399');
    } else if (color === '#F59E0B') {
      grad.addColorStop(0, '#F59E0B');
      grad.addColorStop(1, '#FBBF24');
    } else {
      grad.addColorStop(0, '#EF4444');
      grad.addColorStop(1, '#F87171');
    }

    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';
    ctx.stroke();
  },

  /**
   * Draw EMI Principal vs Interest Doughnut Chart
   */
  renderEMIDoughnut(canvasId, principal, interest) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = 220;
    const height = canvas.height = 220;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 80;
    const innerRadius = 55;

    ctx.clearRect(0, 0, width, height);

    const total = principal + interest;
    if (total <= 0) return;

    const principalAngle = (principal / total) * (2 * Math.PI);
    const interestAngle = (interest / total) * (2 * Math.PI);

    // Draw Principal Segment
    let startAngle = -0.5 * Math.PI;
    let endAngle = startAngle + principalAngle;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = '#10B981';
    ctx.fill();

    // Draw Interest Segment
    startAngle = endAngle;
    endAngle = startAngle + interestAngle;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = '#3B82F6';
    ctx.fill();
  }
};
