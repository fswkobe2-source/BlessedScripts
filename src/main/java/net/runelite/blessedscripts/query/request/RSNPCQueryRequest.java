package net.runelite.blessedscripts.query.request;

import net.runelite.blessedscripts.wrappers.RSNPC;

import java.util.Arrays;
import java.util.List;

import static net.runelite.blessedscripts.methods.MethodProvider.methods;

public class RSNPCQueryRequest extends PositionableQueryRequest<RSNPC> {
    public RSNPCQueryRequest() {
        super(Integer.MAX_VALUE);
    }

    public List request() {
        return Arrays.asList(methods.npcs.getAll());
    }
}
