package net.runelite.blessedscripts.query.request;


import net.runelite.blessedscripts.wrappers.RSPlayer;

import java.util.Arrays;
import java.util.List;

import static net.runelite.blessedscripts.methods.MethodProvider.methods;

public class RSPlayerQueryRequest extends PositionableQueryRequest<RSPlayer> {
    public RSPlayerQueryRequest() {
        super(Integer.MAX_VALUE);
    }
    public List<RSPlayer> request() {
        return Arrays.asList(methods.players.getAll());
    }
}
