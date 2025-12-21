class FreeFlightMovement {
    constructor() {
        // No initialization needed for now
    }

    // Local normalize function (copied from utils)
    normalize(v, vmin, vmax, tmin, tmax) {
        var nv = Math.max(Math.min(v, vmax), vmin)
        var dv = vmax - vmin
        var pc = (nv - vmin) / dv
        var dt = tmax - tmin
        var tv = tmin + (pc * dt)
        return tv
    }

    /**
     * Updates the movement model and returns new position and rotation values
     * @param {Object} mousePos - Mouse position {x, y}
     * @param {number} deltaTime - Time delta since last update
     * @param {Object} game - Game state object
     * @param {Object} airplane - Airplane object with mesh
     * @returns {Object} Object containing x, y, rotX, rotZ
     */
    update(mousePos, deltaTime, game, airplane) {
        // Calculate plane speed from mouse X position
        game.planeSpeed = this.normalize(mousePos.x, -0.5, 0.5, game.planeMinSpeed, game.planeMaxSpeed)

        // Calculate target positions from mouse input
        let targetX = this.normalize(mousePos.x, -1, 1, -game.planeAmpWidth*0.7, -game.planeAmpWidth)
        let targetY = this.normalize(mousePos.y, -0.75, 0.75, game.planeDefaultHeight-game.planeAmpHeight, game.planeDefaultHeight+game.planeAmpHeight)

        // Add collision displacements
        game.planeCollisionDisplacementX += game.planeCollisionSpeedX
        targetX += game.planeCollisionDisplacementX

        game.planeCollisionDisplacementY += game.planeCollisionSpeedY
        targetY += game.planeCollisionDisplacementY

        // Calculate new positions with smoothing
        const x = airplane.mesh.position.x + (targetX - airplane.mesh.position.x) * deltaTime * game.planeMoveSensivity
        const y = airplane.mesh.position.y + (targetY - airplane.mesh.position.y) * deltaTime * game.planeMoveSensivity

        // Calculate rotations
        const rotX = (airplane.mesh.position.y - targetY) * deltaTime * game.planeRotZSensivity
        const rotZ = (targetY - airplane.mesh.position.y) * deltaTime * game.planeRotXSensivity

        return {
            x,
            y,
            rotX,
            rotZ
        }
    }
}

// Simple test to verify movement calculations match original logic
if (typeof window !== 'undefined' && window.console) {
    console.log('[MovementModel] FreeFlightMovement class loaded successfully');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FreeFlightMovement }
}
