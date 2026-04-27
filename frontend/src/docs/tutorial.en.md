# DIPS – OjOs Tutorial

*DIPS-OjOS* (Detecting Irregular Photometric Signals OJimetrO Survey) is a project aimed at reviewing light curves of stars with exoplanet transits to inspect and classify all transits present in them. The objective is to detect certain subtle anomalies that may be present in these transits and could reveal starspot crossing events, stellar flares, the presence of rings, dust, transit duration variations, or the presence of additional bodies such as exomoons.

We start by logging into the project's website [http://dipsojos.uniovi.es](http://dipsojos.uniovi.es) with our username and password and click *Enter* (you can access test mode with the username *public* and the password *public*).

![](/docs/tutorial/en/1.png)

Once inside the application, on the left panel, we will see the curves available for classification (All). We can also see all the curves pending classification (Pending) and those we have already finished classifying (Done). Next to each curve's identifier (Curve #), a progress bar is displayed indicating the classification status of each curve, as well as the number of classified transits / total transits for each curve.

![](/docs/tutorial/en/2.png)

The curves can be real or simulated, so we will inspect them in blind mode, without knowing what type of curve we are working with. The simulated curves represent exoplanet transits with realistic physical parameters, with or without satellites, transiting stars with and without spots, with a variety of radii for the star, the planet, and possible satellites, with transit timing variations (TTVs), with different periods and orbital semi-major axes... Analyzing simulated curves will help us quantify the efficiency of the work by generating more or fewer false positives and by recovering or missing certain signals that we know are present in the simulated curves.

In the central part of the tool, the main figure is presented. It is a flux versus time graph (in days) composed of the real points of the curve (white dots) and the theoretical fit model (red curve) calculated by the code, which best fits globally to all the transits of the curve. The deviations of the points from the theoretical model reflect possible phenomena that could be taking place, which are precisely what we want to detect and study.

Above the curve, the transit timing variation (TTV) obtained by the model is indicated. The transit should occur at a certain theoretical moment in time that the code calculates from the central time officially tabulated for the first transit of that exoplanet and its orbital period. However, when the code fits the model to each transit, it obtains a central time for each transit. The difference is what is known as TTV and can be the result of noise present in the transit, the effect of starspots, or actually be due to the influence of other planets or even the presence of exomoons.

Below the transit figure, we have the residuals figure. This represents how much each real point deviates from the model, and it can provide us with information even more clearly than the transit figure.

![](/docs/tutorial/en/3.png)

On the right side of the application, another panel is presented with certain parameters for the transits of that exoplanet (both theoretical and those fitted by the model). Furthermore, we can navigate through the different transits of the light curve using the < (previous) and > (next) buttons.

![](/docs/tutorial/en/4.png)

On the right, we also have the different checkboxes that allow us to classify each of the transits, as well as a text box where we can write notes. We must inspect in detail the central figure that presents the data for each transit along with the model, as well as the residuals figure. If we detect any anomaly, we must report it by checking the corresponding checkbox (we can check multiple checkboxes in the same transit). Once checked, when we move to another transit, what we have marked will be automatically saved in the database. If we inspect the same transit again and change the classification, this will be automatically refreshed in the database, and if we click the *Delete classifications* button, we will erase all the classifications we have made for the transits of the curve we are studying.

![](/docs/tutorial/en/5.png)

Classification Examples:

**Normal Morphology:** the observed points are uniformly distributed around the model. The deviations are uniform and are due to noise.

![](/docs/tutorial/en/6.png)

**Anomalous Morphology:** we will check this box if we detect any structure in the transit that does not fit into any of the other categories. Comments can be made in the **Notes** box to complete the inspection of any transit.

![](/docs/tutorial/en/7.png)

**Left / Right Asymmetry:** if we notice that there is a clear deviation at the entrance / exit of the transit.

![](/docs/tutorial/en/8.png)

![](/docs/tutorial/en/9.png)

**Interior flux increase:** if we notice a clear flux increase in the central region of the transit.

![](/docs/tutorial/en/10.png)

**Interior flux decrease:** if we notice a clear flux decrease in the central region of the transit.

![](/docs/tutorial/en/11.png)

**Marked TDV:** we will check this box (Transit Duration Variation) if we clearly notice that the transit duration is longer or shorter than that of the theoretical model.

![](/docs/tutorial/en/12.png)

**Bad model fit:** we will check this box if the model has clearly failed to fit the observed transit.

![](/docs/tutorial/en/13.png)
