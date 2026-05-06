package balancer

type Router struct {
	pools map[string]*Pool
}

func NewRouter(pools map[string][]string) *Router {
	r := &Router{pools: make(map[string]*Pool, len(pools))}
	for label, upstreams := range pools {
		r.pools[label] = NewPool(upstreams)
	}
	return r
}

func (r *Router) Route(label string) *Pool {
	if p, ok := r.pools[label]; ok {
		return p
	}
	return r.pools["general"]
}
