package net.runelite.client.plugins.microbot.api.playerstate;

import net.runelite.client.plugins.microbot.Microbot;
import net.runelite.api.Client;
import net.runelite.api.coords.WorldPoint;

/**
 * Stub implementation of Rs2PlayerStateCache
 */
public class Rs2PlayerStateCache {
    
    private WorldPoint lastPosition;
    private long lastUpdate;
    
    public Rs2PlayerStateCache() {
        this.lastPosition = null;
        this.lastUpdate = System.currentTimeMillis();
    }
    
    public WorldPoint getLastPosition() {
        return lastPosition;
    }
    
    public void updatePosition(WorldPoint position) {
        this.lastPosition = position;
        this.lastUpdate = System.currentTimeMillis();
    }
    
    public boolean hasMoved() {
        WorldPoint currentPos = Microbot.getClient().getLocalPlayer().getWorldLocation();
        return !currentPos.equals(lastPosition);
    }
    
    public long getLastUpdate() {
        return lastUpdate;
    }
    
    public void reset() {
        lastPosition = null;
        lastUpdate = System.currentTimeMillis();
    }
}
